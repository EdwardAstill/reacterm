import type { TreeNode } from "./Tree.js";
export type ReorderState = {
    phase: "idle";
} | {
    phase: "marking";
    marked: string[];
} | {
    phase: "grabbed";
    mode: "live" | "stash";
    moving: string[];
};
export interface MoveContext {
    movedKeys: string[];
    targetParentKey: string | null;
    targetIndex: number;
    mode: "live" | "stash";
}
export interface ReorderChange extends MoveContext {
    previousParents: Record<string, string | null>;
    previousIndices: Record<string, number>;
    nextNodes: TreeNode[];
    expandedKeys: string[];
}
export interface TreeController {
    toggleMark(key: string): void;
    clearMarks(): void;
    getMarked(): string[];
    grabLive(key?: string): boolean;
    grabStash(): boolean;
    commit(): void;
    cancel(): void;
    moveUp(): void;
    moveDown(): void;
    indent(): void;
    outdent(): void;
    getCursorKey(): string | null;
}
//# sourceMappingURL=Tree.types.d.ts.map