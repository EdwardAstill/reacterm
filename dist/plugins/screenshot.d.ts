/**
 * Screenshot Plugin — capture the current screen as SVG.
 *
 * Listens for Ctrl+Shift+S and writes the current buffer state to
 * an SVG file using the built-in SVG renderer. Files are named with
 * timestamps and saved to the current directory (configurable).
 */
import type { StormPlugin } from "../core/plugin.js";
export interface ScreenshotPluginOptions {
    /** Directory to save screenshots (default: current working directory). */
    outputDir?: string;
    /** File name prefix (default: "storm-screenshot"). */
    prefix?: string;
    /** SVG font size in pixels (default: 14). */
    fontSize?: number;
    /** SVG font family (default: "Menlo, Monaco, monospace"). */
    fontFamily?: string;
    /** SVG background color (default: "#0B0E14"). */
    backgroundColor?: string;
    /** SVG padding in pixels (default: 16). */
    padding?: number;
    /** Callback invoked after a screenshot is saved. */
    onCapture?: (filePath: string) => void;
}
/**
 * Create a screenshot plugin with the given options.
 *
 * @example
 * ```ts
 * import { render, screenshotPlugin } from "reacterm";
 *
 * const app = render(<App />, {
 *   plugins: [screenshotPlugin({ outputDir: "./screenshots" })],
 * });
 * ```
 */
export declare function screenshotPlugin(options?: ScreenshotPluginOptions): StormPlugin;
//# sourceMappingURL=screenshot.d.ts.map