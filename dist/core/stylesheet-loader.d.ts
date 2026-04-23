/**
 * StyleSheet Loader — file-based stylesheet loading with live reloading.
 *
 * Parses `.storm.css` files (CSS-like syntax for terminal components)
 * and optionally watches for changes to enable hot-reload during development.
 *
 * @example
 * ```ts
 * const { stylesheet, close } = createStyleSheetLoader({
 *   path: "./app.storm.css",
 *   watch: true,
 *   onReload: (sheet) => console.log("Reloaded", sheet.rules.length, "rules"),
 * });
 * ```
 *
 * File format:
 * ```
 * /* Global text style *\/
 * Text {
 *   color: #FFFFFF;
 *   bold: false;
 * }
 *
 * Text.title {
 *   color: #82AAFF;
 *   bold: true;
 * }
 *
 * Button:focus {
 *   inverse: true;
 *   borderColor: #FFB800;
 * }
 *
 * Box.sidebar {
 *   width: 30;
 *   borderStyle: single;
 *   borderColor: #333333;
 * }
 * ```
 */
export interface StyleSheetLoaderOptions {
    /** Path to .storm.css or .storm.json stylesheet file. */
    path: string;
    /** Enable file watching for live reload (default: true in dev, false in prod). */
    watch?: boolean;
    /** Callback when stylesheet is reloaded. */
    onReload?: (stylesheet: ParsedStyleSheet) => void;
    /** Callback when a parse or file error occurs. */
    onError?: (error: Error) => void;
}
export interface ParsedStyleSheet {
    rules: StyleRule[];
    /** CSS custom properties defined in :root blocks. */
    variables: Map<string, string>;
}
export interface StyleRule {
    selector: string;
    properties: Record<string, unknown>;
}
/**
 * Parse a .storm.css file into StyleSheet rules.
 *
 * Supports:
 * - CSS-like block syntax: `selector { property: value; }`
 * - Block comments: `/* ... *\/`
 * - Line comments: `// ...`
 * - Multiple selectors per file
 * - Property value auto-parsing (numbers, booleans, strings, percentages)
 * - CSS custom properties: `:root { --name: value; }` and `var(--name)` / `var(--name, fallback)`
 *
 * @param source - The raw .storm.css file content
 * @returns Parsed stylesheet with rules and variables
 */
export declare function parseStormCSS(source: string): ParsedStyleSheet;
/**
 * Create a stylesheet loader that reads (and optionally watches) a file.
 *
 * Returns the initial parsed stylesheet and a `close()` function to stop
 * watching. If the file cannot be read on initial load, an error is thrown.
 * During watch mode, file errors are handled gracefully — the previous
 * stylesheet is retained and the error is reported via `onError`.
 *
 * @param options - Loader configuration
 * @returns The initial stylesheet and a cleanup function
 * @throws If the file cannot be read during initial load
 */
export declare function createStyleSheetLoader(options: StyleSheetLoaderOptions): {
    stylesheet: ParsedStyleSheet;
    close: () => void;
};
//# sourceMappingURL=stylesheet-loader.d.ts.map