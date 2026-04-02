/**
 * useBuffer — gives components limited direct access to the screen buffer.
 *
 * Useful for custom rendering effects that bypass the normal layout/paint
 * pipeline. Write cells at absolute screen coordinates, read existing
 * cell content, and request a repaint.
 *
 * Usage:
 * ```tsx
 * const { writeCell, readCell, requestRender } = useBuffer();
 * writeCell(10, 5, "X", "#ff0000");
 * requestRender();
 * ```
 */

import { useTui } from "../context/TuiContext.js";
import { parseColor } from "../core/types.js";

export interface BufferAccess {
  /** Write a single character to the screen buffer at absolute coordinates. */
  writeCell(x: number, y: number, char: string, fg?: string, bg?: string): void;
  /** Read the current cell content at absolute coordinates. Returns null if out of bounds or no buffer. */
  readCell(x: number, y: number): { char: string; fg: number; bg: number } | null;
  /** Trigger a repaint cycle (without React reconciliation). */
  requestRender(): void;
}

export function useBuffer(): BufferAccess {
  const { renderContext, requestRender } = useTui();

  return {
    writeCell(x: number, y: number, char: string, fg?: string, bg?: string): void {
      const buffer = renderContext.buffer;
      if (!buffer) return;
      if (x < 0 || x >= buffer.width || y < 0 || y >= buffer.height) return;
      const cell = buffer.getCell(x, y);
      buffer.setCell(x, y, {
        char,
        fg: fg !== undefined ? parseColor(fg) : cell.fg,
        bg: bg !== undefined ? parseColor(bg) : cell.bg,
        attrs: cell.attrs,
        ulColor: cell.ulColor,
      });
    },

    readCell(x: number, y: number): { char: string; fg: number; bg: number } | null {
      const buffer = renderContext.buffer;
      if (!buffer) return null;
      if (x < 0 || x >= buffer.width || y < 0 || y >= buffer.height) return null;
      const cell = buffer.getCell(x, y);
      return { char: cell.char, fg: cell.fg, bg: cell.bg };
    },

    requestRender,
  };
}
