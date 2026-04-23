export interface TableBehaviorColumn {
    key: string;
    header: string;
    width?: number;
    align?: "left" | "center" | "right";
}
export interface UseTableBehaviorOptions {
    columns: TableBehaviorColumn[];
    data: Array<Record<string, string | number>>;
    isActive?: boolean;
    maxVisibleRows?: number;
    scrollOffset?: number;
    onScrollChange?: (offset: number) => void;
    onRowSelect?: (rowIndex: number) => void;
    rowHighlight?: boolean;
    sortable?: boolean;
    onSort?: (columnKey: string, direction: "asc" | "desc") => void;
    multiSelect?: boolean;
    onSelectionChange?: (selectedIndices: number[]) => void;
    editable?: boolean;
    onCellEdit?: (rowIndex: number, columnKey: string, newValue: string) => void;
}
export interface TableBehaviorEditing {
    row: number;
    col: number;
    value: string;
    cursor: number;
}
export interface UseTableBehaviorResult {
    /** Current cursor row index */
    cursorRow: number;
    /** Current cursor column index */
    cursorCol: number;
    /** Current sort column key (if any) */
    sortKey: string | null;
    /** Current sort direction */
    sortDir: "asc" | "desc" | null;
    /** Set of selected row indices (for multi-select) */
    selectedRows: ReadonlySet<number>;
    /** Whether cursor is on the header row */
    onHeaderRow: boolean;
    /** Current scroll offset for virtualization */
    scrollOffset: number;
    /** Visible row range start */
    visibleStart: number;
    /** Visible row range end (exclusive) */
    visibleEnd: number;
    /** Whether virtualization is active */
    isVirtualized: boolean;
    /** Current editing state (null if not editing) */
    editing: TableBehaviorEditing | null;
    /** Get props for a cell */
    getCellProps: (row: number, col: number) => {
        isCursorRow: boolean;
        isCursorCol: boolean;
        isCursorCell: boolean;
        isSelected: boolean;
        isEditing: boolean;
    };
    /** Get props for a column header */
    getHeaderProps: (col: number) => {
        isCursorCol: boolean;
        isSorted: boolean;
        sortDirection: "asc" | "desc" | null;
        columnKey: string;
    };
}
export declare function useTableBehavior(options: UseTableBehaviorOptions): UseTableBehaviorResult;
//# sourceMappingURL=useTableBehavior.d.ts.map