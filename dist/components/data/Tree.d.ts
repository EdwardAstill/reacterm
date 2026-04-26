import React from "react";
import type { MoveContext, ReorderChange, ReorderState, TreeController } from "./Tree.types.js";
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
    /** True when the node's key is in the current mark set (marking phase only). */
    isMarked: boolean;
    /** True when the node is currently being moved (grabbed:live or grabbed:stash). */
    isGrabbed: boolean;
    /** Reserved for future stash drop-target rendering. Always false in v1. */
    isDropTarget: boolean;
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
    /** Enables reorder mode; when false (default), controller + reorder callbacks are inert. */
    reorderable?: boolean;
    /** Optional predicate consulted per motion step; rejection makes the step a no-op. */
    canMove?: (ctx: MoveContext) => boolean;
    /** Fires once per completed reorder (on commit). */
    onReorder?: (change: ReorderChange) => void;
    /** Fires on every reorder state transition. */
    onStateChange?: (state: ReorderState) => void;
    /**
     * Ref-holding prop (not React's `ref` keyword) populated with an imperative
     * controller handle when `reorderable` is true. Apps bind their own keys to
     * these methods — Tree adds no default keybindings for reorder.
     */
    controller?: {
        current: TreeController | null;
    };
}
export declare const Tree: React.NamedExoticComponent<TreeProps>;
//# sourceMappingURL=Tree.d.ts.map