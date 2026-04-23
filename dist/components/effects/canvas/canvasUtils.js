import { colors as defaultColors } from "../../../theme/colors.js";
const MAX_INDEX_DEPTH = 50;
/** Build flat index of all nodes by ID, tracking parent and siblings. */
export function buildNodeIndex(nodes, parentId = null, depth = 0) {
    const index = new Map();
    if (depth >= MAX_INDEX_DEPTH)
        return index;
    const siblingIds = nodes.map(n => n.id);
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        index.set(node.id, { node, parentId, siblingIndex: i, siblingIds });
        if (node.children) {
            for (const [k, v] of buildNodeIndex(node.children, node.id, depth + 1)) {
                index.set(k, v);
            }
        }
    }
    return index;
}
/** Classify how an edge should be rendered. */
export function classifyEdge(edge, nodeIndex) {
    const fromEntry = nodeIndex.get(edge.from);
    const toEntry = nodeIndex.get(edge.to);
    if (!fromEntry || !toEntry)
        return null;
    if (fromEntry.parentId === toEntry.parentId) {
        const diff = Math.abs(fromEntry.siblingIndex - toEntry.siblingIndex);
        return diff === 1 ? "sibling-adjacent" : "sibling-distant";
    }
    return "cross-container";
}
function buildStatusColors(colors) {
    return {
        success: colors.success,
        error: colors.error,
        warning: colors.warning,
        info: colors.info,
        running: colors.brand.primary,
    };
}
/** Resolve effective color for a node (explicit > status > default). */
export function resolveNodeColor(node, colors = defaultColors) {
    if (node.color)
        return node.color;
    if (node.borderColor)
        return node.borderColor;
    const statusColors = buildStatusColors(colors);
    if (node.status)
        return statusColors[node.status] ?? colors.text.dim;
    return colors.text.dim;
}
/** Get edges that connect children of a specific parent. */
export function getSiblingEdges(parentId, edges, nodeIndex) {
    // Key: "fromId->toId", only for adjacent siblings
    const result = new Map();
    for (const edge of edges) {
        const cls = classifyEdge(edge, nodeIndex);
        if (cls === "sibling-adjacent") {
            const fromEntry = nodeIndex.get(edge.from);
            if (fromEntry && fromEntry.parentId === parentId) {
                result.set(`${edge.from}->${edge.to}`, edge);
            }
        }
    }
    return result;
}
//# sourceMappingURL=canvasUtils.js.map