/**
 * Render middleware — intercept and transform the rendering pipeline.
 *
 * Middleware runs after painting, before diff output. This allows:
 * - Post-processing effects (CRT scanlines, blur, vignette)
 * - Buffer inspection/debugging
 * - Custom overlay rendering
 * - Performance monitoring
 * - Screenshot capture
 */

import type { ScreenBuffer } from "./buffer.js";

export interface RenderMiddleware {
  /** Unique name for this middleware */
  readonly name: string;

  /**
   * Execution priority. Lower values run first. Default: 100.
   * When two middlewares have equal priority, registration order is preserved.
   */
  readonly priority?: number;

  /**
   * Called after painting, before diff. Receives the buffer and can modify it.
   * Return the buffer (same or new) to pass to the next middleware.
   * `shared` is a key-value store for inter-middleware communication.
   */
  onPaint?: (buffer: ScreenBuffer, width: number, height: number, shared: Map<string, unknown>) => ScreenBuffer;

  /**
   * Called after diff output is computed, before writing to terminal.
   * Can inspect or modify the ANSI output string.
   * `shared` is a key-value store for inter-middleware communication.
   */
  onOutput?: (output: string, shared: Map<string, unknown>) => string;

  /**
   * Called on each layout computation. Can inspect the layout tree.
   */
  onLayout?: (rootWidth: number, rootHeight: number) => void;
}

/** Default priority for middlewares that don't specify one. */
const DEFAULT_MW_PRIORITY = 100;

export class MiddlewarePipeline {
  private middlewares: RenderMiddleware[] = [];
  /** Tracks registration order for stable sorting when priorities are equal. */
  private registrationOrder = new Map<string, number>();
  private registrationCounter = 0;

  /** Shared key-value store for inter-middleware communication. */
  readonly shared = new Map<string, unknown>();

  /** Sort middlewares by priority (lower first), then registration order for ties. */
  private sortMiddlewares(): void {
    this.middlewares.sort((a, b) => {
      const priDiff = (a.priority ?? DEFAULT_MW_PRIORITY) - (b.priority ?? DEFAULT_MW_PRIORITY);
      if (priDiff !== 0) return priDiff;
      return (this.registrationOrder.get(a.name) ?? 0) - (this.registrationOrder.get(b.name) ?? 0);
    });
  }

  /** Register a middleware. Sorted by priority (lower runs first); equal priority preserves registration order. */
  use(mw: RenderMiddleware): void {
    this.registrationOrder.set(mw.name, this.registrationCounter++);
    this.middlewares.push(mw);
    this.sortMiddlewares();
  }

  /** Remove a middleware by name. */
  remove(name: string): void {
    this.middlewares = this.middlewares.filter(m => m.name !== name);
    this.registrationOrder.delete(name);
  }

  /** Check if a middleware with the given name is registered. */
  has(name: string): boolean {
    return this.middlewares.some(m => m.name === name);
  }

  /** Return the number of registered middlewares. */
  get size(): number {
    return this.middlewares.length;
  }

  /** Middlewares that have thrown — skipped on subsequent frames. */
  private failed = new Set<string>();

  /** Run all onPaint hooks, threading the buffer through each. Errors are isolated. */
  runPaint(buffer: ScreenBuffer, width: number, height: number): ScreenBuffer {
    let buf = buffer;
    for (const mw of this.middlewares) {
      if (this.failed.has(mw.name)) continue;
      if (mw.onPaint) {
        try {
          buf = mw.onPaint(buf, width, height, this.shared);
        } catch (err) {
          this.failed.add(mw.name);
          process.stderr.write(`[storm] Middleware "${mw.name}" error in onPaint: ${(err as Error).message}\n`);
        }
      }
    }
    return buf;
  }

  /** Run all onOutput hooks, threading the ANSI string through each. Errors are isolated. */
  runOutput(output: string): string {
    let out = output;
    for (const mw of this.middlewares) {
      if (this.failed.has(mw.name)) continue;
      if (mw.onOutput) {
        try {
          out = mw.onOutput(out, this.shared);
        } catch (err) {
          this.failed.add(mw.name);
          process.stderr.write(`[storm] Middleware "${mw.name}" error in onOutput: ${(err as Error).message}\n`);
        }
      }
    }
    return out;
  }

  /** Run all onLayout hooks (notification only, no return value). Errors are isolated. */
  runLayout(rootWidth: number, rootHeight: number): void {
    for (const mw of this.middlewares) {
      if (this.failed.has(mw.name)) continue;
      if (mw.onLayout) {
        try {
          mw.onLayout(rootWidth, rootHeight);
        } catch (err) {
          this.failed.add(mw.name);
          process.stderr.write(`[storm] Middleware "${mw.name}" error in onLayout: ${(err as Error).message}\n`);
        }
      }
    }
  }
}

// ── Helper utilities ────────────────────────────────────────────────

/** Extract R/G/B channels from a 24-bit 0xRRGGBB integer. */
function extractRgb(color: number): [number, number, number] {
  return [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff];
}

/** Pack R/G/B channels into a 24-bit 0xRRGGBB integer. */
function packRgb(r: number, g: number, b: number): number {
  return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}

/**
 * Darken a 24-bit RGB color by the given factor (0..1).
 * Factor 0.15 means "reduce brightness by 15%".
 */
export function darkenColor(color: number, factor: number): number {
  const [r, g, b] = extractRgb(color);
  const f = 1 - Math.max(0, Math.min(1, factor));
  return packRgb(Math.round(r * f), Math.round(g * f), Math.round(b * f));
}

// ── Built-in middlewares ────────────────────────────────────────────

/**
 * Scanline effect — dims every other row for a CRT feel.
 * @param opacity Dimming factor between 0 and 1. Default 0.15 (subtle).
 */
export function scanlineMiddleware(opacity?: number): RenderMiddleware {
  return {
    name: "scanline",
    onPaint(buffer, width, height, _shared) {
      const dim = opacity ?? 0.15;
      for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x++) {
          const bg = buffer.getBg(x, y);
          if (bg !== -1) {
            buffer.setCell(x, y, {
              char: buffer.getChar(x, y),
              fg: buffer.getFg(x, y),
              bg: darkenColor(bg, dim),
              attrs: buffer.getAttrs(x, y),
              ulColor: buffer.getUlColor(x, y),
            });
          }
        }
      }
      return buffer;
    },
  };
}

/**
 * FPS counter — renders a small FPS indicator in the top-right corner.
 * Updates once per second. Useful for performance debugging.
 */
export function fpsCounterMiddleware(): RenderMiddleware {
  let lastTime = performance.now();
  let frames = 0;
  let fps = 0;
  return {
    name: "fps-counter",
    onPaint(buffer, width, _height) {
      frames++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        fps = frames;
        frames = 0;
        lastTime = now;
      }
      const label = ` ${fps} FPS `;
      const startX = width - label.length - 1;
      for (let i = 0; i < label.length; i++) {
        const x = startX + i;
        if (x >= 0 && x < width) {
          buffer.setCell(x, 0, { char: label[i]!, fg: 0x808080, bg: -1, attrs: 0, ulColor: -1 });
        }
      }
      return buffer;
    },
  };
}

/**
 * Debug border — draws a 1-cell border around the entire screen.
 * Helps visualize the exact terminal boundaries during development.
 */
export function debugBorderMiddleware(color?: number): RenderMiddleware {
  const fg = color ?? 0xff0000;
  return {
    name: "debug-border",
    onPaint(buffer, width, height, _shared) {
      // Top and bottom rows
      for (let x = 0; x < width; x++) {
        buffer.setCell(x, 0, { char: "─", fg, bg: -1, attrs: 0, ulColor: -1 });
        buffer.setCell(x, height - 1, { char: "─", fg, bg: -1, attrs: 0, ulColor: -1 });
      }
      // Left and right columns
      for (let y = 0; y < height; y++) {
        buffer.setCell(0, y, { char: "│", fg, bg: -1, attrs: 0, ulColor: -1 });
        buffer.setCell(width - 1, y, { char: "│", fg, bg: -1, attrs: 0, ulColor: -1 });
      }
      // Corners
      buffer.setCell(0, 0, { char: "┌", fg, bg: -1, attrs: 0, ulColor: -1 });
      buffer.setCell(width - 1, 0, { char: "┐", fg, bg: -1, attrs: 0, ulColor: -1 });
      buffer.setCell(0, height - 1, { char: "└", fg, bg: -1, attrs: 0, ulColor: -1 });
      buffer.setCell(width - 1, height - 1, { char: "┘", fg, bg: -1, attrs: 0, ulColor: -1 });
      return buffer;
    },
  };
}
