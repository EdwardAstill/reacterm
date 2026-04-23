/**
 * Merge component defaults with user style overrides.
 * Performs a shallow spread-merge: user overrides win per-prop (no shorthand expansion).
 */
export declare function mergeBoxStyles(defaults: Record<string, unknown>, overrides: Record<string, unknown>): Record<string, unknown>;
/** Extract only layout props (flex, size, margin, position) from a mixed props bag. For Box/ScrollView. */
export declare function pickLayoutProps<T>(props: T): Record<string, unknown>;
/** Extract layout + visual props (border, padding, bg, color). Superset of pickLayoutProps. */
export declare function pickStyleProps<T>(props: T): Record<string, unknown>;
//# sourceMappingURL=applyStyles.d.ts.map