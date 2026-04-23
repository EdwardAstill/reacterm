import React from "react";
export interface TreeNode {
    key: string;
    label: string;
    children?: TreeNode[];
    expanded?: boolean;
    /** Optional icon rendered before the label. */
    icon?: string;
}
export interface TreeRenderState {
    isExpanded: boolean;
    isHighlighted: boolean;
    isSelected: boolean;
    depth: number;
}
export interface TreeProps {
    nodes: TreeNode[];
    onToggle?: (key: string) => void;
    onSelect?: (key: string, node: TreeNode) => void;
    selectedKey?: string;
    onHighlightChange?: (key: string, node: TreeNode) => void;
    color?: string | number;
    isFocused?: boolean;
    /** Maximum visible nodes for virtual scrolling (default: all visible). */
    maxVisible?: number;
    /** Custom renderer for each tree node. */
    renderNode?: (node: TreeNode, state: TreeRenderState) => React.ReactNode;
}
export declare const Tree: React.NamedExoticComponent<TreeProps>;
//# sourceMappingURL=Tree.d.ts.map