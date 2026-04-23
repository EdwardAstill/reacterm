import React from "react";
import type { StormContainerStyleProps } from "../../styles/styleProps.js";
export interface DataGridColumn {
    key: string;
    label: string;
    width?: number;
    align?: "left" | "right" | "center";
}
export interface DataGridProps extends StormContainerStyleProps {
    columns: DataGridColumn[];
    rows: Array<Record<string, string | number>>;
    selectedRow?: number;
    onSelect?: (rowIndex: number) => void;
    sortColumn?: string;
    sortDirection?: "asc" | "desc";
    onSort?: (column: string) => void;
    isFocused?: boolean;
    headerColor?: string | number;
    selectedColor?: string | number;
    "aria-label"?: string;
    /** Maximum rows rendered at once (default 100). Rows beyond this are virtualized. */
    maxVisibleRows?: number;
    /** Called when the scroll offset changes due to navigation or virtualization. */
    onScrollChange?: (offset: number) => void;
    /** Enable multi-row selection. Space toggles, Shift+Up/Down extends range. */
    multiSelect?: boolean;
    /** Called when the set of selected rows changes in multiSelect mode. */
    onSelectionChange?: (selectedIndices: number[]) => void;
    /** Enable inline cell editing. Press Enter on a data cell to edit. */
    editable?: boolean;
    /** Called when a cell edit is confirmed. */
    onCellEdit?: (rowIndex: number, columnKey: string, newValue: string) => void;
    /** Enable column resizing with +/- keys on the header row. */
    resizable?: boolean;
    /** Called when a column is resized. */
    onColumnResize?: (columnKey: string, newWidth: number) => void;
    /** Custom renderer for individual data cells. */
    renderCell?: (value: string | number, column: DataGridColumn, rowIndex: number, state: {
        isSelected: boolean;
        isEditing: boolean;
    }) => React.ReactNode;
}
export interface DataGridContextValue {
    columns: DataGridColumn[];
    selectedRow: number | undefined;
    onSelect: ((rowIndex: number) => void) | undefined;
    sortColumn: string | undefined;
    sortDirection: "asc" | "desc" | undefined;
    onSort: ((column: string) => void) | undefined;
    headerColor: string | number;
    selectedColor: string | number;
}
export declare const DataGridContext: React.Context<DataGridContextValue | null>;
export declare function useDataGridContext(): DataGridContextValue;
export interface DataGridRootProps {
    selectedRow?: number;
    onSelect?: (rowIndex: number) => void;
    sortColumn?: string;
    sortDirection?: "asc" | "desc";
    onSort?: (column: string) => void;
    headerColor?: string | number;
    selectedColor?: string | number;
    children: React.ReactNode;
    "aria-label"?: string;
}
declare function DataGridRoot({ selectedRow, onSelect, sortColumn, sortDirection, onSort, headerColor: headerColorProp, selectedColor: selectedColorProp, children, ...rest }: DataGridRootProps): React.ReactElement;
export interface DataGridCompoundColumnProps {
    columnKey: string;
    label: string;
    width?: number;
    align?: "left" | "right" | "center";
    children?: React.ReactNode;
}
declare function DataGridCompoundColumn({ columnKey, label, width, align, children }: DataGridCompoundColumnProps): React.ReactElement;
export interface DataGridCompoundRowProps {
    index: number;
    children: React.ReactNode;
}
declare function DataGridCompoundRow({ index, children }: DataGridCompoundRowProps): React.ReactElement;
export declare const DataGrid: React.NamedExoticComponent<DataGridProps> & {
    Root: typeof DataGridRoot;
    Column: typeof DataGridCompoundColumn;
    Row: typeof DataGridCompoundRow;
};
export {};
//# sourceMappingURL=DataGrid.d.ts.map