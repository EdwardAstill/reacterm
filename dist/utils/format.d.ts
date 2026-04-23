/**
 * Format a number with K/M suffixes.
 * e.g. 1500 -> "1.5K", 2000000 -> "2.0M"
 */
export declare function fmtNum(n: number): string;
/**
 * Format milliseconds to human-readable duration.
 * e.g. 500 -> "500ms", 1500 -> "1.5s", 90000 -> "1m30s"
 */
export declare function fmtDuration(ms: number): string;
/**
 * Format a cost value with currency symbol.
 * Shows more decimal places for small amounts.
 */
export declare function fmtCost(cost: number, currency?: string): string;
/**
 * Format bytes to human-readable file size.
 * e.g. 1234 -> "1.2 KB", 3456789 -> "3.3 MB"
 */
export declare function fmtBytes(bytes: number): string;
/**
 * Format a timestamp to a relative time string.
 * e.g. 2 seconds ago -> "2s ago", 3 minutes ago -> "3m ago"
 */
export declare function fmtRelativeTime(timestamp: number): string;
/**
 * Format a value as a percentage string.
 * e.g. 0.425 -> "42.5%", 1.0 -> "100.0%"
 */
export declare function fmtPercent(value: number, decimals?: number): string;
/** Max rows to sample when auto-sizing column widths. */
export declare const COL_WIDTH_SAMPLE_SIZE = 100;
/**
 * Pad (or truncate) a string to fit a fixed-width table cell.
 *
 * If `text` is longer than `width`, it is truncated with an ellipsis (\u2026).
 * Otherwise it is padded with spaces according to the given alignment.
 */
export declare function padCell(text: string | undefined | null, width: number, align: "left" | "center" | "right"): string;
//# sourceMappingURL=format.d.ts.map