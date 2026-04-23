import { type StormColors } from "./colors.js";
export { colors, type StormColors } from "./colors.js";
export { spacing, type SpacingToken } from "./spacing.js";
export { ThemeProvider, useTheme, ThemeContext, type ThemeWithShades } from "./provider.js";
export { arcticTheme, midnightTheme, emberTheme, mistTheme, voltageTheme, duskTheme, horizonTheme, neonTheme, calmTheme, highContrastTheme, monochromeTheme, } from "./presets.js";
export { loadTheme, parseTheme, saveTheme, serializeTheme } from "./loader.js";
export { validateTheme, validateContrast, type ThemeValidationResult, type ThemeValidationError, type ThemeValidationWarning, } from "./validate.js";
export { generateShades, generateThemeShades, type ColorShades, type ThemeShades, } from "./shades.js";
/** Recursively makes all properties optional. */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
/**
 * Deep-merge overrides onto a base theme. Only the properties you specify
 * are replaced; everything else keeps the base value.
 */
export declare function extendTheme(base: StormColors, overrides: DeepPartial<StormColors>): StormColors;
/**
 * Create a full theme by overriding parts of the default color palette.
 */
export declare function createTheme(partial: DeepPartial<StormColors>): StormColors;
/**
 * Extract `--storm-*` CSS custom properties into a partial StormColors object
 * suitable for passing to `extendTheme()`.
 *
 * The naming convention:
 * - `--storm-{flat}` where flat is success|warning|error|info|divider
 *   → `{ [flat]: value }`
 * - `--storm-{group}-{key}` where group is brand|text|surface|... etc
 *   → `{ [group]: { [key]: value } }`
 *
 * Variables that don't match either pattern are ignored.
 *
 * @param variables - CSS custom property map (keys include the `--` prefix)
 * @returns A partial StormColors object with only the recognized overrides
 *
 * @example
 * ```ts
 * const vars = new Map([
 *   ["--storm-brand-primary", "#FF0000"],
 *   ["--storm-success", "#00FF00"],
 *   ["--storm-text-dim", "#888888"],
 * ]);
 * const overrides = extractThemeOverrides(vars);
 * // { brand: { primary: "#FF0000" }, success: "#00FF00", text: { dim: "#888888" } }
 * ```
 */
export declare function extractThemeOverrides(variables: Map<string, string> | Record<string, string>): DeepPartial<StormColors>;
//# sourceMappingURL=index.d.ts.map