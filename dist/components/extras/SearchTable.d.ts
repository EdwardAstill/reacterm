import React from "react";
import { type TableProps } from "../table/Table.js";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
type TableRow = Record<string, string | number>;
export interface SearchTableProps extends Omit<TableProps, keyof StormLayoutStyleProps>, StormLayoutStyleProps {
    /** Column keys to include in the substring match. Default: every column. */
    searchableColumns?: string[];
    /** Custom predicate. Receives the raw row + the (possibly lowercased) query. */
    filter?: (row: TableRow, query: string) => boolean;
    /** Default false: query lowercased before match. */
    caseSensitive?: boolean;
    /** Placeholder shown when query is empty. */
    placeholder?: string;
    /** Search icon override (default: 🔍). */
    searchIcon?: string;
    /** Show "N results" inline next to the query. Default: true. */
    showResultCount?: boolean;
    /** Debounce delay in ms before recomputing filter. 0 = immediate (default). */
    debounceMs?: number;
    /** Hide the table entirely while query is empty. Default: false. */
    hideTableUntilQuery?: boolean;
    /** Color of the search icon. */
    iconColor?: string | number;
    /** Fired when the user presses Escape on an empty query. */
    onCancel?: () => void;
    /** ARIA label applied to the wrapper. */
    "aria-label"?: string;
}
/**
 * Table + search input as one component with a single focus owner.
 *
 * Owns the query buffer; consumes printable / backspace / escape at higher
 * priority than the underlying Table so navigation keys (arrows, return, tab)
 * still reach the Table for row focus and selection. Callbacks (onRowSelect,
 * onRowPress, onCellPress) receive the row index from the ORIGINAL unfiltered
 * data array — translation happens here so consumers don't have to map back.
 *
 * @example
 * <SearchTable
 *   columns={cols}
 *   data={rows}
 *   rowHighlight
 *   onRowSelect={(i) => open(rows[i])}
 * />
 */
export declare function SearchTable(rawProps: SearchTableProps): React.ReactElement;
export {};
//# sourceMappingURL=SearchTable.d.ts.map