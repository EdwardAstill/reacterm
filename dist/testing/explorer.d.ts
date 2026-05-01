import React from "react";
export type ExplorerAction = "tab" | "enter" | "escape" | "up" | "down" | "left" | "right";
export interface ExplorerOptions {
    terminal?: {
        width?: number;
        height?: number;
    };
    maxDepth?: number;
    actions?: ExplorerAction[];
}
export interface ExplorerReport {
    framesVisited: number;
    actionsTried: number;
    failures: string[];
    visitedHashes: string[];
}
export declare function exploreForTest(element: React.ReactElement, options?: ExplorerOptions): Promise<ExplorerReport>;
//# sourceMappingURL=explorer.d.ts.map