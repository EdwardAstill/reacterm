import type { TreeNode } from "./Tree.js";
import type { ReorderState, ReorderChange, MoveContext } from "./Tree.types.js";
export type ReorderAction = {
    type: "toggleMark";
    key: string;
} | {
    type: "clearMarks";
} | {
    type: "grabLive";
    key: string;
} | {
    type: "grabStash";
    cursorKey: string;
} | {
    type: "moveUp";
} | {
    type: "moveDown";
} | {
    type: "indent";
} | {
    type: "outdent";
} | {
    type: "commit";
    cursorKey: string;
} | {
    type: "cancel";
} | {
    type: "externalNodesChange";
};
export interface ReorderStep {
    state: ReorderState;
    scratchNodes?: TreeNode[];
    ephemeralExpanded?: string[];
    rejected?: boolean;
    change?: ReorderChange;
}
export declare const initialReorderState: ReorderState;
export declare function reorderReducer(state: ReorderState, action: ReorderAction, nodes: TreeNode[], canMove?: (ctx: MoveContext) => boolean, priorScratch?: TreeNode[], priorEphemeral?: string[]): ReorderStep;
//# sourceMappingURL=treeReorderReducer.d.ts.map