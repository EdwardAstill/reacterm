export interface ColumnWidthInput {
    key: string;
    header: string;
    width?: number;
}
/**
 * Compute column widths by sampling data rows.
 * If a column has an explicit `width`, it is used as-is.
 * Otherwise the width is the max of the header length and the longest
 * value in the first COL_WIDTH_SAMPLE_SIZE rows.
 *
 * @param headerField  Which field on the column object holds the header text
 *                     ("header" for Table, "label" for DataGrid).
 */
export declare function computeColumnWidths<C extends {
    key: string;
    width?: number;
}>(columns: ReadonlyArray<C>, data: ReadonlyArray<Record<string, string | number>>, headerField?: string, extraPadding?: number): number[];
/**
 * Shrink auto-sized columns so the full table fits inside the available width.
 *
 * Fixed-width columns (`column.width`) are preserved. Auto-sized columns are
 * reduced one character at a time, widest-first, until the table fits or every
 * auto-sized column is already at the minimum width.
 */
export declare function fitColumnWidthsToAvailableWidth<C extends {
    width?: number;
}>(columns: ReadonlyArray<C>, widths: ReadonlyArray<number>, availableWidth: number, minColumnWidth?: number): number[];
/**
 * Build a horizontal separator string that sits between header and body.
 * Each column segment is `─` repeated (colWidth + 2) for the 1-char padding
 * on each side, joined by the given `joiner` character.
 *
 * Table uses "┼" (`\u253C`), DataGrid uses "─" (`\u2500`).
 */
export declare function buildSeparatorText(colWidths: number[], joiner: string): string;
/**
 * Determine whether a row should receive the zebra-stripe background.
 * Returns `true` when striping is enabled, the row index is odd,
 * and the row is not in a highlighted/selected state.
 */
export declare function shouldStripe(rowIndex: number, stripeEnabled: boolean, isHighlighted: boolean): boolean;
export interface VirtualWindow {
    /** Index of first visible row (inclusive). */
    start: number;
    /** Index past the last visible row (exclusive). */
    end: number;
    /** Total number of rows in the dataset. */
    total: number;
    /** Whether the dataset exceeds maxVisibleRows. */
    needsVirtualization: boolean;
}
/**
 * Compute the visible row window for virtualized rendering.
 */
export declare function computeVirtualWindow(totalRows: number, maxVisibleRows: number, scrollOffset: number): VirtualWindow;
/**
 * Format the "Showing X-Y of Z" (Table) or "X-Y of Z" (DataGrid) indicator.
 *
 * @param prefix  Text before the range, e.g. "Showing " or "" (empty).
 */
export declare function formatRowIndicator(start: number, end: number, total: number, prefix?: string): string;
/**
 * Append a sort direction arrow (▲ or ▼) to a header label when the
 * column is the active sort column.
 */
export declare function headerTextWithSort(label: string, columnKey: string, sortColumn: string | null | undefined, sortDirection: "asc" | "desc" | null | undefined): string;
/**
 * Build a single row line string: each cell is ` <padded> ` joined by the
 * given separator character (typically "│").
 */
export declare function buildRowLine(columns: ReadonlyArray<{
    key: string;
    align?: "left" | "center" | "right";
}>, row: Record<string, string | number>, colWidths: number[], separator?: string): string;
//# sourceMappingURL=table-render.d.ts.map