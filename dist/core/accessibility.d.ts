export interface AccessibilityOptions {
    /** Enable high-contrast mode */
    highContrast: boolean;
    /** Disable all animations (spinners show static, shimmer disabled) */
    reducedMotion: boolean;
    /** Screen reader mode (additional semantic output) */
    screenReader: boolean;
    /** Minimum contrast ratio for text (default 4.5 for WCAG AA) */
    minContrastRatio: number;
}
/** Detect accessibility preferences from environment variables. */
export declare function detectAccessibility(): AccessibilityOptions;
/**
 * Get the relative luminance of a hex color per WCAG 2.x definition.
 * Returns a value between 0 (black) and 1 (white).
 *
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export declare function relativeLuminance(hex: string): number;
/**
 * Calculate the contrast ratio between two hex colors.
 * Returns a value between 1 (no contrast) and 21 (maximum contrast).
 *
 * @see https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export declare function contrastRatio(hex1: string, hex2: string): number;
export declare function meetsContrast(fg: string, bg: string, ratio?: number): boolean;
/**
 * Announce text to screen readers via OSC 99 (kitty notification protocol),
 * with BEL fallback for assertive announcements.
 */
export declare function announce(text: string, priority?: "polite" | "assertive"): string;
//# sourceMappingURL=accessibility.d.ts.map