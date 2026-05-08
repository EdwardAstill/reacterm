export const DEFAULT_MAX_TREE_DEPTH = 100;

export interface FlatVisibleTreeEntry<TNode> {
  node: TNode;
  depth: number;
  isLast: boolean;
  parentIsLast: boolean[];
  hasChildren: boolean;
  siblingIndex: number;
  path: number[];
  parent: TNode | null;
}

export interface FlattenVisibleTreeOptions<TNode> {
  maxDepth?: number;
  getChildren?: (node: TNode) => readonly TNode[] | undefined;
  isExpanded?: (node: TNode) => boolean;
}

type DefaultTreeNode<TNode> = TNode & {
  children?: readonly TNode[];
  expanded?: boolean;
};

const defaultGetChildren = <TNode,>(node: TNode): readonly TNode[] | undefined =>
  (node as DefaultTreeNode<TNode>).children;

const defaultIsExpanded = <TNode,>(node: TNode): boolean =>
  Boolean((node as DefaultTreeNode<TNode>).expanded);

export function flattenVisibleTree<TNode>(
  nodes: readonly TNode[],
  options: FlattenVisibleTreeOptions<TNode> = {},
): FlatVisibleTreeEntry<TNode>[] {
  const {
    maxDepth = DEFAULT_MAX_TREE_DEPTH,
    getChildren = defaultGetChildren,
    isExpanded = defaultIsExpanded,
  } = options;

  const result: FlatVisibleTreeEntry<TNode>[] = [];

  function visit(
    list: readonly TNode[],
    depth: number,
    parentIsLast: boolean[],
    pathPrefix: number[],
    parent: TNode | null,
  ): void {
    if (depth >= maxDepth) return;

    for (let i = 0; i < list.length; i++) {
      const node = list[i]!;
      const children = getChildren(node);
      const hasChildren = children !== undefined && children.length > 0;
      const isLast = i === list.length - 1;
      const path = [...pathPrefix, i];

      result.push({
        node,
        depth,
        isLast,
        parentIsLast: [...parentIsLast],
        hasChildren,
        siblingIndex: i,
        path,
        parent,
      });

      if (hasChildren && isExpanded(node)) {
        visit(children, depth + 1, [...parentIsLast, isLast], path, node);
      }
    }
  }

  visit(nodes, 0, [], [], null);
  return result;
}
