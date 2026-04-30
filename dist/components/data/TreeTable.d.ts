import React from "react";
import type { StormContainerStyleProps } from "../../styles/styleProps.js";
import { type TreeTableRow } from "./TreeTable.flatten.js";
import type { TableColumn, TableStateStyles, TableRenderState } from "../table/Table.js";
export type { TreeTableRow } from "./TreeTable.flatten.js";
export interface TreeTableProps extends StormContainerStyleProps {
    columns: TableColumn[];
    data: TreeTableRow[];
    treeColumnKey?: string;
    onToggle?: (key: string, row: TreeTableRow) => void;
    onRowSelect?: (key: string, row: TreeTableRow) => void;
    onRowPress?: (key: string, row: TreeTableRow) => void;
    onSort?: (columnKey: string, direction: "asc" | "desc") => void;
    onHeaderPress?: (columnKey: string) => void;
    isFocused?: boolean;
    rowHighlight?: boolean;
    sortable?: boolean;
    stripe?: boolean;
    headerColor?: string | number;
    maxVisibleRows?: number;
    scrollOffset?: number;
    onScrollChange?: (offset: number) => void;
    visibleWidth?: number;
    stateStyles?: TableStateStyles;
    renderCell?: (value: string | number, column: TableColumn, row: TreeTableRow, state: TableRenderState) => React.ReactNode;
    renderHeader?: (column: TableColumn) => React.ReactNode;
    renderTreeCell?: (value: string | number, row: TreeTableRow, depth: number, state: TableRenderState & {
        isExpanded: boolean;
        hasChildren: boolean;
    }) => React.ReactNode;
}
export declare const TreeTable: React.NamedExoticComponent<TreeTableProps>;
//# sourceMappingURL=TreeTable.d.ts.map