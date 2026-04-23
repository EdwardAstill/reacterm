/**
 * Status Bar Plugin — persistent status bar with customizable segments.
 *
 * Registers an afterRender hook that paints a status bar to the bottom
 * row of the screen buffer. Segments can display time, memory usage,
 * FPS, or custom text. The bar updates every frame.
 */
/**
 * Create a status bar plugin.
 *
 * @example
 * ```ts
 * import { render, statusBarPlugin } from "reacterm";
 *
 * const app = render(<App />, {
 *   plugins: [statusBarPlugin({
 *     segments: [
 *       { type: "text", value: "My App v1.0" },
 *       { type: "time", format: "24h" },
 *       { type: "fps" },
 *       { type: "memory" },
 *     ],
 *   })],
 * });
 * ```
 */
export function statusBarPlugin(options = {}) {
    const segments = options.segments ?? [
        { type: "time", format: "24h" },
        { type: "fps" },
        { type: "memory" },
    ];
    const separator = options.separator ?? " | ";
    const bgColor = options.bgColor ?? 0x1e1e2e;
    const fgColor = options.fgColor ?? 0xcdd6f4;
    const position = options.position ?? "bottom";
    let renderContext = null;
    let lastFps = 0;
    return {
        name: "status-bar",
        setup(ctx) {
            renderContext = ctx.renderContext;
        },
        afterRender(info) {
            lastFps = Math.round(1000 / Math.max(info.renderTimeMs, 1));
            paintStatusBar(info.renderTimeMs);
        },
        cleanup() {
            renderContext = null;
        },
    };
    function paintStatusBar(_renderTimeMs) {
        if (!renderContext)
            return;
        const buffer = renderContext.buffer;
        if (!buffer)
            return;
        const row = position === "top" ? 0 : buffer.height - 1;
        const text = buildStatusText();
        // Fill the row with the status text (padded to full width)
        const padded = text.padEnd(buffer.width);
        buffer.writeString(0, row, padded, fgColor, bgColor, 0);
    }
    function buildStatusText() {
        const parts = [];
        for (const segment of segments) {
            switch (segment.type) {
                case "time": {
                    const now = new Date();
                    if (segment.format === "12h") {
                        const h = now.getHours() % 12 || 12;
                        const m = now.getMinutes().toString().padStart(2, "0");
                        const s = now.getSeconds().toString().padStart(2, "0");
                        const ampm = now.getHours() >= 12 ? "PM" : "AM";
                        parts.push(`${h}:${m}:${s} ${ampm}`);
                    }
                    else {
                        const h = now.getHours().toString().padStart(2, "0");
                        const m = now.getMinutes().toString().padStart(2, "0");
                        const s = now.getSeconds().toString().padStart(2, "0");
                        parts.push(`${h}:${m}:${s}`);
                    }
                    break;
                }
                case "memory": {
                    const mem = process.memoryUsage();
                    const rss = (mem.rss / 1024 / 1024).toFixed(1);
                    const heap = (mem.heapUsed / 1024 / 1024).toFixed(1);
                    parts.push(`RSS ${rss}MB / Heap ${heap}MB`);
                    break;
                }
                case "fps": {
                    const metrics = renderContext?.metrics;
                    const fps = metrics?.fps ?? lastFps;
                    parts.push(`${fps} FPS`);
                    break;
                }
                case "text": {
                    parts.push(segment.value);
                    break;
                }
                case "custom": {
                    try {
                        parts.push(segment.render());
                    }
                    catch {
                        parts.push("[error]");
                    }
                    break;
                }
            }
        }
        return " " + parts.join(separator) + " ";
    }
}
//# sourceMappingURL=status-bar.js.map