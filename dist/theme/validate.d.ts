import type { StormColors } from "./colors.js";
export interface ThemeValidationResult {
    valid: boolean;
    errors: ThemeValidationError[];
    warnings: ThemeValidationWarning[];
}
export interface ThemeValidationError {
    path: string;
    message: string;
    value?: string;
}
export interface ThemeValidationWarning {
    path: string;
    message: string;
}
/**
 * Validate a theme for correctness.
 *
 * - Checks every leaf value is a valid hex string (#RGB, #RRGGBB) or a CSS named color.
 * - Reports missing required fields as errors.
 * - Reports unusually low-contrast text colors as warnings.
 *
 * @param theme - A full StormColors object to validate.
 * @returns A result with `valid`, `errors`, and `warnings`.
 */
export declare function validateTheme(theme: StormColors): ThemeValidationResult;
/**
 * Check all text-role color pairs in a theme for WCAG contrast compliance.
 *
 * - Pairs below 4.5:1 ratio produce **warnings** (WCAG AA).
 * - Pairs below 3:1 ratio produce **errors** (WCAG minimum for large text).
 *
 * @param theme - A full StormColors object.
 * @param background - The background hex color to check against (defaults to "#1A1A2E").
 * @returns A result with `valid`, `errors`, and `warnings`.
 */
export declare function validateContrast(theme: StormColors, background?: string): ThemeValidationResult;
//# sourceMappingURL=validate.d.ts.map