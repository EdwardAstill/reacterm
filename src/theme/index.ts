import { colors as defaultColors, type ReactermColors } from "./colors.js";

export { colors, type ReactermColors } from "./colors.js";
export { spacing, type SpacingToken } from "./spacing.js";
export { ThemeProvider, useTheme, ThemeContext, type ThemeWithShades } from "./provider.js";
export {
  arcticTheme,
  midnightTheme,
  emberTheme,
  mistTheme,
  voltageTheme,
  duskTheme,
  horizonTheme,
  neonTheme,
  calmTheme,
  highContrastTheme,
  monochromeTheme,
} from "./presets.js";
export { loadTheme, parseTheme, saveTheme, serializeTheme } from "./loader.js";
export {
  validateTheme,
  validateContrast,
  type ThemeValidationResult,
  type ThemeValidationError,
  type ThemeValidationWarning,
} from "./validate.js";
export {
  generateShades,
  generateThemeShades,
  type ColorShades,
  type ThemeShades,
} from "./shades.js";

import { deepMerge } from "./utils.js";

/** Recursively makes all properties optional. */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Deep-merge overrides onto a base theme. Only the properties you specify
 * are replaced; everything else keeps the base value.
 */
export function extendTheme(base: ReactermColors, overrides: DeepPartial<ReactermColors>): ReactermColors {
  return deepMerge(base as unknown as Record<string, unknown>, overrides as Record<string, unknown>) as ReactermColors;
}

/**
 * Create a full theme by overriding parts of the default color palette.
 */
export function createTheme(partial: DeepPartial<ReactermColors>): ReactermColors {
  return extendTheme(defaultColors, partial);
}

/**
 * Mapping from `--reacterm-{group}-{key}` CSS variable names to nested
 * ReactermColors paths.
 *
 * Flat fields (success, warning, error, info, divider) use single-segment
 * names: `--reacterm-success` → `{ success: "#..." }`.
 *
 * Nested fields use two segments: `--reacterm-brand-primary` → `{ brand: { primary: "#..." } }`.
 *
 * Only variables that start with `--reacterm-` are processed; everything else
 * is silently ignored. Unknown group/key combinations are also skipped so
 * that user-defined custom properties don't pollute the theme.
 */

/** The set of top-level keys that are flat strings (not nested objects). */
const FLAT_KEYS = new Set(["success", "warning", "error", "info", "divider"]);

/** All valid nested group names from ReactermColors. */
const NESTED_GROUPS = new Set([
  "brand", "text", "surface", "system", "user", "assistant", "thinking",
  "tool", "approval", "input", "diff", "syntax",
]);

/**
 * Extract `--reacterm-*` CSS custom properties into a partial ReactermColors object
 * suitable for passing to `extendTheme()`.
 *
 * The naming convention:
 * - `--reacterm-{flat}` where flat is success|warning|error|info|divider
 *   → `{ [flat]: value }`
 * - `--reacterm-{group}-{key}` where group is brand|text|surface|... etc
 *   → `{ [group]: { [key]: value } }`
 *
 * Variables that don't match either pattern are ignored.
 *
 * @param variables - CSS custom property map (keys include the `--` prefix)
 * @returns A partial ReactermColors object with only the recognized overrides
 *
 * @example
 * ```ts
 * const vars = new Map([
 *   ["--reacterm-brand-primary", "#FF0000"],
 *   ["--reacterm-success", "#00FF00"],
 *   ["--reacterm-text-dim", "#888888"],
 * ]);
 * const overrides = extractThemeOverrides(vars);
 * // { brand: { primary: "#FF0000" }, success: "#00FF00", text: { dim: "#888888" } }
 * ```
 */
export function extractThemeOverrides(
  variables: Map<string, string> | Record<string, string>,
): DeepPartial<ReactermColors> {
  const overrides: Record<string, unknown> = {};

  const entries: Iterable<[string, string]> =
    variables instanceof Map ? variables.entries() : Object.entries(variables);

  for (const [name, value] of entries) {
    // Only process --reacterm-* variables
    if (!name.startsWith("--reacterm-")) continue;

    // Strip the `--reacterm-` prefix → e.g. "brand-primary" or "success"
    const rest = name.slice("--reacterm-".length);

    // Try flat field first (no hyphen, e.g. "success")
    if (FLAT_KEYS.has(rest)) {
      overrides[rest] = value;
      continue;
    }

    // Try nested: split on first hyphen → group + key
    const hyphenIdx = rest.indexOf("-");
    if (hyphenIdx === -1) continue; // single segment but not a flat key — skip

    const group = rest.slice(0, hyphenIdx);
    const key = rest.slice(hyphenIdx + 1);

    if (!NESTED_GROUPS.has(group) || !key) continue;

    // Convert remaining hyphens to camelCase: "added-bg" → "addedBg"
    const camelKey = key.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());

    if (!overrides[group]) {
      overrides[group] = {};
    }
    (overrides[group] as Record<string, string>)[camelKey] = value;
  }

  return overrides as DeepPartial<ReactermColors>;
}

