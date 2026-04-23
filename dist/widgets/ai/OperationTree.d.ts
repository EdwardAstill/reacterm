import React from "react";
export interface OpNode {
    id: string;
    label: string;
    status: "pending" | "running" | "completed" | "failed" | "cancelled";
    children?: OpNode[];
    detail?: string;
    durationMs?: number;
}
export interface OperationTreeProps {
    nodes: OpNode[];
    maxDepth?: number;
    showDuration?: boolean;
    /** Custom render for each operation node. */
    renderNode?: (node: OpNode, state: {
        depth: number;
    }) => React.ReactNode;
    /** Custom spinner animation frames (default: braille spinner). */
    spinnerFrames?: string[];
    /** Spinner animation interval in ms (default: 80). */
    spinnerInterval?: number;
    /** Override status icons by status key. */
    statusIcons?: Partial<Record<string, string>>;
    /** Override tree connector characters. */
    treeConnectors?: {
        branch?: string;
        last?: string;
        pipe?: string;
        space?: string;
    };
}
export declare const OperationTree: React.NamedExoticComponent<OperationTreeProps>;
//# sourceMappingURL=OperationTree.d.ts.map