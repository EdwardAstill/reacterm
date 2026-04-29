export const MAX_TREE_DEPTH = 100;

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

export function flattenVisible(
  rows: TreeTableRow[],
  depth: number = 0,
  parentIsLast: boolean[] = [],
): FlatTreeTableRow[] {
  if (depth >= MAX_TREE_DEPTH) return [];
  const out: FlatTreeTableRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const isLast = i === rows.length - 1;
    const hasChildren = row.children !== undefined && row.children.length > 0;
    out.push({ row, depth, isLast, parentIsLast: [...parentIsLast], hasChildren });
    if (hasChildren && row.expanded) {
      out.push(...flattenVisible(row.children!, depth + 1, [...parentIsLast, isLast]));
    }
  }
  return out;
}
