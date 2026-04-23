import React from "react";
/**
 * Render text with search highlights. Splits text by query matches
 * (case-insensitive) and returns an array of tui-text elements with
 * highlighted (inverse) spans for matches.
 *
 * @param text         The full text to render.
 * @param query        The search query to highlight.
 * @param baseProps    Base tui-text props (color, dim, bold, etc.) for non-highlighted segments.
 * @param keyPrefix    Prefix for React keys to avoid collisions.
 * @param highlightProps  Additional props for highlighted spans (e.g. `{ color: matchColor }`).
 */
export declare function renderHighlightedText(text: string, query: string, baseProps: Record<string, unknown>, keyPrefix: string | number, highlightProps?: Record<string, unknown>): React.ReactElement[];
//# sourceMappingURL=highlight.d.ts.map