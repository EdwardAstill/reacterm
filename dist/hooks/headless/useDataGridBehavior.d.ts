import type { KeyEvent } from "../../input/types.js";
export interface DataGridBehaviorColumn {
    key: string;
    label: string;
    width?: number;
    align?: "left" | "right" | "center";
}
export interface DataGridBehaviorEditState {
    row: number;
    col: number;
    value: string;
    cursor: number;
}
export interface UseDataGridBehaviorOptions {
    columns: DataGridBehaviorColumn[];
    rows: Array<Record<string, string | number>>;
    selectedRow?: number | undefined;
    onSelect?: ((rowIndex: number) => void) | undefined;
    sortColumn?: string | undefined;
    sortDirection?: ("asc" | "desc") | undefined;
    onSort?: ((column: string) => void) | undefined;
    isActive?: boolean | undefined;
    /** Maximum rows rendered at once (default 100). Rows beyond this are virtualized. */
    maxVisibleRows?: number | undefined;
    /** Called when the scroll offset changes due to navigation or virtualization. */
    onScrollChange?: ((offset: number) => void) | undefined;
    /** Enable multi-row selection. Space toggles, Shift+Up/Down extends range. */
    multiSelect?: boolean | undefined;
    /** Called when the set of selected rows changes in multiSelect mode. */
    onSelectionChange?: ((selectedIndices: number[]) => void) | undefined;
    /** Enable inline cell editing. Press Enter on a data cell to edit. */
    editable?: boolean | undefined;
    /** Called when a cell edit is confirmed. */
    onCellEdit?: ((rowIndex: number, columnKey: string, newValue: string) => void) | undefined;
    /** Enable column resizing with +/- keys on the header row. */
    resizable?: boolean | undefined;
    /** Called when a column is resized. */
    onColumnResize?: ((columnKey: string, newWidth: number) => void) | undefined;
}
export interface UseDataGridBehaviorResult {
    /** The currently focused cell: row index and column index */
    focusedCell: {
        row: number;
        col: number;
        onHeaderRow: boolean;
    };
    /** Sort state passthrough */
    sortState: {
        column: string | undefined;
        direction: "asc" | "desc" | undefined;
    };
    /** Set of multi-selected row indices */
    selectionSet: ReadonlySet<number>;
    /** Current inline edit state, or null */
    editState: DataGridBehaviorEditState | null;
    /** Column width overrides from resizing */
    resizeState: Readonly<Record<string, number>>;
    /** Virtualization window: start index (inclusive), end index (exclusive) */
    virtualWindow: {
        start: number;
        end: number;
        total: number;
        needsVirtualization: boolean;
    };
    /** Computed column widths (incorporating overrides, explicit widths, and auto-sizing) */
    columnWidths: number[];
    /** The active row index (selectedRow prop or cursor row) */
    activeRow: number;
    /** Input handler (already wired via useInput) */
    handleInput: (event: KeyEvent) => void;
    /** Original rows passthrough */
    rows: Array<Record<string, string | number>>;
    /** Original columns passthrough */
    columns: DataGridBehaviorColumn[];
}
export declare function useDataGridBehavior(options: UseDataGridBehaviorOptions): UseDataGridBehaviorResult;
//# sourceMappingURL=useDataGridBehavior.d.ts.map