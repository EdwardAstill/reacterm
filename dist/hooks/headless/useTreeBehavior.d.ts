export interface TreeBehaviorNode {
    key: string;
    label: string;
    children?: TreeBehaviorNode[];
    expanded?: boolean;
    icon?: string;
}
export interface FlatTreeNode {
    node: TreeBehaviorNode;
    depth: number;
    isLast: boolean;
    parentIsLast: boolean[];
    hasChildren: boolean;
}
export interface UseTreeBehaviorOptions {
    nodes: TreeBehaviorNode[];
    onToggle?: (key: string) => void;
    onSelect?: (key: string, node: TreeBehaviorNode) => void;
    selectedKey?: string;
    onHighlightChange?: (key: string, node: TreeBehaviorNode) => void;
    isActive?: boolean;
    maxVisible?: number;
}
export interface UseTreeBehaviorResult {
    /** Flattened visible nodes in display order */
    visibleNodes: FlatTreeNode[];
    /** Index of the highlighted node */
    highlightIndex: number;
    /** Set of expanded node keys */
    expandedKeys: Set<string>;
    /** Controlled selected key passthrough, if provided. */
    selectedKey: string | undefined;
    /** Toggle expand/collapse of a node */
    toggle: (key: string) => void;
    /** Select the currently highlighted node or a specific key. */
    select: (key?: string) => void;
    /** Visible range start index (for virtual scrolling) */
    visibleStart: number;
    /** Visible range end index */
    visibleEnd: number;
    /** Number of hidden nodes above visible window */
    hiddenAbove: number;
    /** Number of hidden nodes below visible window */
    hiddenBelow: number;
    /** Get props for a node by its key */
    getNodeProps: (key: string) => {
        isHighlighted: boolean;
        isExpanded: boolean;
        hasChildren: boolean;
        depth: number;
        node: TreeBehaviorNode;
    };
}
export declare function useTreeBehavior(options: UseTreeBehaviorOptions): UseTreeBehaviorResult;
//# sourceMappingURL=useTreeBehavior.d.ts.map