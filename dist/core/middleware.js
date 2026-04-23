const DEFAULT_MW_PRIORITY = 100;
export class MiddlewarePipeline {
    middlewares = [];
    registrationOrder = new Map();
    registrationCounter = 0;
    shared = new Map();
    sortMiddlewares() {
        this.middlewares.sort((a, b) => {
            const priDiff = (a.priority ?? DEFAULT_MW_PRIORITY) - (b.priority ?? DEFAULT_MW_PRIORITY);
            if (priDiff !== 0)
                return priDiff;
            return (this.registrationOrder.get(a.name) ?? 0) - (this.registrationOrder.get(b.name) ?? 0);
        });
    }
    use(mw) {
        this.registrationOrder.set(mw.name, this.registrationCounter++);
        this.middlewares.push(mw);
        this.sortMiddlewares();
    }
    remove(name) {
        this.middlewares = this.middlewares.filter(m => m.name !== name);
        this.registrationOrder.delete(name);
    }
    has(name) {
        return this.middlewares.some(m => m.name === name);
    }
    get size() {
        return this.middlewares.length;
    }
    /** Middlewares that have thrown are skipped on subsequent frames. */
    failed = new Set();
    runPaint(buffer, width, height) {
        let buf = buffer;
        for (const mw of this.middlewares) {
            if (this.failed.has(mw.name))
                continue;
            if (mw.onPaint) {
                try {
                    buf = mw.onPaint(buf, width, height, this.shared);
                }
                catch (err) {
                    this.failed.add(mw.name);
                    process.stderr.write(`[storm] Middleware "${mw.name}" error in onPaint: ${err.message}\n`);
                }
            }
        }
        return buf;
    }
    runOutput(output) {
        let out = output;
        for (const mw of this.middlewares) {
            if (this.failed.has(mw.name))
                continue;
            if (mw.onOutput) {
                try {
                    out = mw.onOutput(out, this.shared);
                }
                catch (err) {
                    this.failed.add(mw.name);
                    process.stderr.write(`[storm] Middleware "${mw.name}" error in onOutput: ${err.message}\n`);
                }
            }
        }
        return out;
    }
    runLayout(rootWidth, rootHeight) {
        for (const mw of this.middlewares) {
            if (this.failed.has(mw.name))
                continue;
            if (mw.onLayout) {
                try {
                    mw.onLayout(rootWidth, rootHeight);
                }
                catch (err) {
                    this.failed.add(mw.name);
                    process.stderr.write(`[storm] Middleware "${mw.name}" error in onLayout: ${err.message}\n`);
                }
            }
        }
    }
}
function extractRgb(color) {
    return [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff];
}
function packRgb(r, g, b) {
    return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}
/**
 * Darken a 24-bit RGB color by the given factor (0..1).
 * Factor 0.15 means "reduce brightness by 15%".
 */
export function darkenColor(color, factor) {
    const [r, g, b] = extractRgb(color);
    const f = 1 - Math.max(0, Math.min(1, factor));
    return packRgb(Math.round(r * f), Math.round(g * f), Math.round(b * f));
}
/** Dims every other row for a CRT scanline effect. */
export function scanlineMiddleware(opacity) {
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
/** FPS indicator in the top-right corner. Updates once per second. */
export function fpsCounterMiddleware() {
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
                    buffer.setCell(x, 0, { char: label[i], fg: 0x808080, bg: -1, attrs: 0, ulColor: -1 });
                }
            }
            return buffer;
        },
    };
}
/** 1-cell border around the screen to visualize terminal boundaries. */
export function debugBorderMiddleware(color) {
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
//# sourceMappingURL=middleware.js.map