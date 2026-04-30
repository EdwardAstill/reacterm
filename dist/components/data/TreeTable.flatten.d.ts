export declare const MAX_TREE_DEPTH = 100;
export interface TreeTableRow {
    key: string;
    values: Record<string, string | number>;
    children?: TreeTableRow[];
    expanded?: boolean;
    icon?: string;
}
export interface FlatTreeTableRow {
    row: TreeTableRow;
    depth: number;
    isLast: boolean;
    parentIsLast: boolean[];
    hasChildren: boolean;
}
export declare function flattenVisible(rows: TreeTableRow[], depth?: number, parentIsLast?: boolean[]): FlatTreeTableRow[];
//# sourceMappingURL=TreeTable.flatten.d.ts.map