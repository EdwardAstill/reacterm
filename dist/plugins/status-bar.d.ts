/**
 * Status Bar Plugin — persistent status bar with customizable segments.
 *
 * Registers an afterRender hook that paints a status bar to the bottom
 * row of the screen buffer. Segments can display time, memory usage,
 * FPS, or custom text. The bar updates every frame.
 */
import type { StormPlugin } from "../core/plugin.js";
export type StatusBarSegment = {
    type: "time";
    format?: "12h" | "24h";
} | {
    type: "memory";
} | {
    type: "fps";
} | {
    type: "text";
    value: string;
} | {
    type: "custom";
    render: () => string;
};
export interface StatusBarPluginOptions {
    /** Segments to display, left-to-right. Default: [time, fps, memory]. */
    segments?: StatusBarSegment[];
    /** Separator between segments (default: " | "). */
    separator?: string;
    /** Background color as packed RGB int (default: dim gray 0x1E1E2E). */
    bgColor?: number;
    /** Foreground color as packed RGB int (default: light gray 0xCDD6F4). */
    fgColor?: number;
    /** Position: "top" or "bottom" (default: "bottom"). */
    position?: "top" | "bottom";
}
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
export declare function statusBarPlugin(options?: StatusBarPluginOptions): StormPlugin;
//# sourceMappingURL=status-bar.d.ts.map