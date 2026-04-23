import { colors as defaultColors } from "./colors.js";
export { colors } from "./colors.js";
export { spacing } from "./spacing.js";
export { ThemeProvider, useTheme, ThemeContext } from "./provider.js";
export { arcticTheme, midnightTheme, emberTheme, mistTheme, voltageTheme, duskTheme, horizonTheme, neonTheme, calmTheme, highContrastTheme, monochromeTheme, } from "./presets.js";
export { loadTheme, parseTheme, saveTheme, serializeTheme } from "./loader.js";
export { validateTheme, validateContrast, } from "./validate.js";
export { generateShades, generateThemeShades, } from "./shades.js";
import { deepMerge } from "./utils.js";
/**
 * Deep-merge overrides onto a base theme. Only the properties you specify
 * are replaced; everything else keeps the base value.
 */
export function extendTheme(base, overrides) {
    return deepMerge(base, overrides);
}
/**
 * Create a full theme by overriding parts of the default color palette.
 */
export function createTheme(partial) {
    return extendTheme(defaultColors, partial);
}
/**
 * Mapping from `--storm-{group}-{key}` CSS variable names to nested
 * StormColors paths.
 *
 * Flat fields (success, warning, error, info, divider) use single-segment
 * names: `--storm-success` → `{ success: "#..." }`.
 *
 * Nested fields use two segments: `--storm-brand-primary` → `{ brand: { primary: "#..." } }`.
 *
 * Only variables that start with `--storm-` are processed; everything else
 * is silently ignored. Unknown group/key combinations are also skipped so
 * that user-defined custom properties don't pollute the theme.
 */
/** The set of top-level keys that are flat strings (not nested objects). */
const FLAT_KEYS = new Set(["success", "warning", "error", "info", "divider"]);
/** All valid nested group names from StormColors. */
const NESTED_GROUPS = new Set([
    "brand", "text", "surface", "system", "user", "assistant", "thinking",
    "tool", "approval", "input", "diff", "syntax",
]);
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
export function extractThemeOverrides(variables) {
    const overrides = {};
    const entries = variables instanceof Map ? variables.entries() : Object.entries(variables);
    for (const [name, value] of entries) {
        // Only process --storm-* variables
        if (!name.startsWith("--storm-"))
            continue;
        // Strip the `--storm-` prefix → e.g. "brand-primary" or "success"
        const rest = name.slice("--storm-".length);
        // Try flat field first (no hyphen, e.g. "success")
        if (FLAT_KEYS.has(rest)) {
            overrides[rest] = value;
            continue;
        }
        // Try nested: split on first hyphen → group + key
        const hyphenIdx = rest.indexOf("-");
        if (hyphenIdx === -1)
            continue; // single segment but not a flat key — skip
        const group = rest.slice(0, hyphenIdx);
        const key = rest.slice(hyphenIdx + 1);
        if (!NESTED_GROUPS.has(group) || !key)
            continue;
        // Convert remaining hyphens to camelCase: "added-bg" → "addedBg"
        const camelKey = key.replace(/-([a-z])/g, (_m, c) => c.toUpperCase());
        if (!overrides[group]) {
            overrides[group] = {};
        }
        overrides[group][camelKey] = value;
    }
    return overrides;
}
//# sourceMappingURL=index.js.map