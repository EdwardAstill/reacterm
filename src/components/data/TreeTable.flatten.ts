import { flattenVisibleTree } from "../../utils/tree-flatten.js";

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
  siblingIndex: number;
  path: number[];
  parentKey: string | null;
}

export function flattenVisible(
  rows: TreeTableRow[],
  depth: number = 0,
  parentIsLast: boolean[] = [],
  pathPrefix: number[] = [],
  parentKey: string | null = null,
): FlatTreeTableRow[] {
  if (depth >= MAX_TREE_DEPTH) return [];
  return flattenVisibleTree(rows, { maxDepth: MAX_TREE_DEPTH - depth }).map((entry) => ({
    row: entry.node,
    depth: depth + entry.depth,
    isLast: entry.isLast,
    parentIsLast: [...parentIsLast, ...entry.parentIsLast],
    hasChildren: entry.hasChildren,
    siblingIndex: entry.siblingIndex,
    path: [...pathPrefix, ...entry.path],
    parentKey: entry.parent?.key ?? parentKey,
  }));
}
