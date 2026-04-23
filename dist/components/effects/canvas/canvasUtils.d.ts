import { type StormColors } from "../../../theme/colors.js";
import type { CanvasNode, CanvasEdge } from "./types.js";
export interface NodeEntry {
    node: CanvasNode;
    parentId: string | null;
    siblingIndex: number;
    siblingIds: string[];
}
/** Build flat index of all nodes by ID, tracking parent and siblings. */
export declare function buildNodeIndex(nodes: CanvasNode[], parentId?: string | null, depth?: number): Map<string, NodeEntry>;
/** Classify how an edge should be rendered. */
export declare function classifyEdge(edge: CanvasEdge, nodeIndex: Map<string, NodeEntry>): "sibling-adjacent" | "sibling-distant" | "cross-container" | null;
/** Resolve effective color for a node (explicit > status > default). */
export declare function resolveNodeColor(node: CanvasNode, colors?: StormColors): string | number;
/** Get edges that connect children of a specific parent. */
export declare function getSiblingEdges(parentId: string | null, edges: CanvasEdge[], nodeIndex: Map<string, NodeEntry>): Map<string, CanvasEdge>;
//# sourceMappingURL=canvasUtils.d.ts.map