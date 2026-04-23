import React from "react";
import type { StormContainerStyleProps } from "../../styles/styleProps.js";
export interface TableColumn {
    key: string;
    header: string;
    width?: number;
    align?: "left" | "center" | "right";
    focusable?: boolean;
    editable?: boolean;
    locked?: boolean;
}
export type TableFocusMode = "row" | "column" | "cell";
export interface TableCellRef {
    row: number;
    column: string | number;
}
export interface TableCellStyle {
    color?: string | number;
    backgroundColor?: string | number;
    bold?: boolean;
    dim?: boolean;
    underline?: boolean;
    inverse?: boolean;
}
export interface TableStateStyles {
    header?: TableCellStyle;
    focusedRow?: TableCellStyle;
    focusedColumn?: TableCellStyle;
    focusedCell?: TableCellStyle;
    selectedRow?: TableCellStyle;
    selectedCell?: TableCellStyle;
    editedCell?: TableCellStyle;
    lockedCell?: TableCellStyle;
}
export interface TableRenderState {
    isFocusedRow: boolean;
    isFocusedColumn: boolean;
    isFocusedCell: boolean;
    isSelectedRow: boolean;
    isSelectedCell: boolean;
    isEdited: boolean;
    isLocked: boolean;
    isEditable: boolean;
    isFocusable: boolean;
    isEditing: boolean;
}
export interface TableProps extends StormContainerStyleProps {
    columns: TableColumn[];
    data: Record<string, string | number>[];
    headerColor?: string | number;
    stripe?: boolean;
    /** Maximum rows rendered at once (default 100). Rows beyond this are virtualized. */
    maxVisibleRows?: number;
    /** Current scroll offset into the data array (default 0). */
    scrollOffset?: number;
    /** Called when the scroll offset changes due to virtualization. */
    onScrollChange?: (offset: number) => void;
    /** Whether the table is focused for keyboard input. */
    isFocused?: boolean;
    /** Called when Enter is pressed on a data row. Receives the row index. */
    onRowSelect?: (rowIndex: number) => void;
    /** When true, highlight the current row with inverse styling. */
    rowHighlight?: boolean;
    /** Visible width of the table in columns for horizontal scroll (default: total column width). */
    visibleWidth?: number;
    /** Enable column sorting. Press "s" to cycle sort on the current column header. */
    sortable?: boolean;
    /** Called when a column sort is triggered. */
    onSort?: (columnKey: string, direction: "asc" | "desc") => void;
    /** Custom renderer for individual cells. */
    renderCell?: (value: string | number, column: TableColumn, rowIndex: number, state: TableRenderState) => React.ReactNode;
    /** Custom renderer for header cells. */
    renderHeader?: (column: TableColumn) => React.ReactNode;
    /** Called when a data row is clicked. */
    onRowPress?: (rowIndex: number) => void;
    /** Called when a data cell is clicked. */
    onCellPress?: (rowIndex: number, columnKey: string) => void;
    /** Called when a header cell is clicked. */
    onHeaderPress?: (columnKey: string) => void;
    /** Visual focus model for controlled table state. */
    focusMode?: TableFocusMode;
    focusedRow?: number;
    focusedColumn?: string | number;
    focusedCell?: TableCellRef | null;
    selectedRows?: number[];
    selectedCells?: TableCellRef[];
    editedCells?: TableCellRef[];
    lockedCells?: TableCellRef[];
    stateStyles?: TableStateStyles;
    editable?: boolean;
    onCellEdit?: (rowIndex: number, columnKey: string, newValue: string) => void;
    isCellLocked?: (value: string | number, column: TableColumn, rowIndex: number, row: Record<string, string | number>) => boolean;
    isCellEditable?: (value: string | number, column: TableColumn, rowIndex: number, row: Record<string, string | number>) => boolean;
    isCellFocusable?: (value: string | number, column: TableColumn, rowIndex: number, row: Record<string, string | number>) => boolean;
}
export interface TableContextValue {
    columns: TableColumn[];
    registerColumn: (col: TableColumn) => void;
}
export declare const TableContext: React.Context<TableContextValue | null>;
export declare function useTableContext(): TableContextValue;
export interface TableRootProps {
    headerColor?: string | number;
    stripe?: boolean;
    isFocused?: boolean;
    children: React.ReactNode;
    "aria-label"?: string;
}
declare function TableRoot({ headerColor, stripe, isFocused, children, ...rest }: TableRootProps): React.ReactElement;
export interface TableCompoundHeaderProps {
    children: React.ReactNode;
}
declare function TableCompoundHeader({ children }: TableCompoundHeaderProps): React.ReactElement;
export interface TableCompoundBodyProps {
    children: React.ReactNode;
}
declare function TableCompoundBody({ children }: TableCompoundBodyProps): React.ReactElement;
export interface TableCompoundRowProps {
    children: React.ReactNode;
    highlighted?: boolean;
}
declare function TableCompoundRow({ children, highlighted }: TableCompoundRowProps): React.ReactElement;
export interface TableCompoundCellProps {
    children: React.ReactNode;
    width?: number;
    align?: "left" | "center" | "right";
    bold?: boolean;
    color?: string | number;
}
declare function TableCompoundCell({ children, width, align, bold, color: cellColor }: TableCompoundCellProps): React.ReactElement;
export declare const Table: React.NamedExoticComponent<TableProps> & {
    Root: typeof TableRoot;
    Header: typeof TableCompoundHeader;
    Body: typeof TableCompoundBody;
    Row: typeof TableCompoundRow;
    Cell: typeof TableCompoundCell;
};
export {};
//# sourceMappingURL=Table.d.ts.map