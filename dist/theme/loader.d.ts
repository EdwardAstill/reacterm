import { type StormColors } from "./colors.js";
/**
 * Load a theme from a JSON file.
 *
 * The file may contain a partial theme — only the specified properties
 * will override the defaults. All other values keep the default palette.
 *
 * @param filePath - Absolute or relative path to a JSON theme file.
 * @returns A complete StormColors object with defaults filled in.
 */
export declare function loadTheme(filePath: string): StormColors;
/**
 * Load a theme from a JSON string.
 *
 * Partial themes are deep-merged with the default color palette.
 *
 * @param json - A JSON string representing a full or partial theme.
 * @returns A complete StormColors object with defaults filled in.
 */
export declare function parseTheme(json: string): StormColors;
/**
 * Save a theme to a JSON file as pretty-printed JSON.
 *
 * @param theme - The StormColors theme to save.
 * @param filePath - Absolute or relative path to write the JSON file.
 */
export declare function saveTheme(theme: StormColors, filePath: string): void;
/**
 * Export a theme as a formatted JSON string without writing to disk.
 *
 * @param theme - The StormColors theme to serialize.
 * @returns A pretty-printed JSON string.
 */
export declare function serializeTheme(theme: StormColors): string;
//# sourceMappingURL=loader.d.ts.map