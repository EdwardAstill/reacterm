/**
 * Unicode character width detection with full grapheme cluster support.
 *
 * Returns the display width of a character in terminal cells:
 * - Most characters: 1
 * - CJK ideographs, fullwidth forms: 2
 * - Combining marks, zero-width: 0
 * - Control characters: 0
 * - ZWJ emoji sequences (e.g. 👨‍👩‍👧‍👦): 2 (single glyph in terminal)
 * - Skin tone modifiers, variation selectors, flag emoji: handled via grapheme clusters
 *
 * Uses Intl.Segmenter (Node 16+) for correct grapheme cluster boundaries,
 * solving the industry-wide problem of ZWJ emoji width miscalculation.
 *
 * Uses a pre-computed lookup table for BMP characters (U+0000-U+FFFF)
 * for O(1) width lookups. Supplementary planes use range checks (rare).
 */
export declare function charWidth(code: number): number;
/** Fast check: returns true if every char code is < 128 (pure ASCII). */
export declare function isAscii(str: string): boolean;
/** Get the display width of a string in terminal cells. */
export declare function stringWidth(str: string): number;
/**
 * A grapheme cluster with its display width and original segment string.
 * Used by buffer/renderer for correct per-grapheme cell placement.
 */
export interface Grapheme {
    /** The full grapheme cluster string (may be multiple codepoints). */
    readonly text: string;
    /** Terminal display width in columns (0, 1, or 2). */
    readonly width: number;
}
/**
 * Iterate over grapheme clusters in a string, yielding each cluster
 * with its display width. This is the primitive that all rendering loops
 * should use instead of manual codepoint iteration.
 *
 * When Intl.Segmenter is available, correctly handles ZWJ sequences,
 * skin tone modifiers, flag emoji, etc. Falls back to codepoint-by-codepoint
 * iteration otherwise.
 */
export declare function iterGraphemes(str: string): Generator<Grapheme>;
//# sourceMappingURL=unicode.d.ts.map