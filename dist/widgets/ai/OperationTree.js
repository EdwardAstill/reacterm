import React, { useRef } from "react";
import { useTui } from "../../context/TuiContext.js";
import { useCleanup } from "../../hooks/useCleanup.js";
import { fmtDuration } from "../../utils/format.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { useColors } from "../../hooks/useColors.js";
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_INTERVAL = 80;
const STATUS_ICONS = {
    pending: "○",
    completed: "✓",
    failed: "✗",
    cancelled: "⊘",
};
function getStatusColors(colors) {
    return {
        pending: colors.tool.pending,
        running: colors.tool.running,
        completed: colors.tool.completed,
        failed: colors.tool.failed,
        cancelled: colors.tool.cancelled,
    };
}
function hasRunningNode(nodes) {
    for (const node of nodes) {
        if (node.status === "running")
            return true;
        if (node.children && hasRunningNode(node.children))
            return true;
    }
    return false;
}
function collectRunningRefs(nodes, refs, depth, maxDepth) {
    if (maxDepth !== undefined && depth >= maxDepth)
        return;
    for (const node of nodes) {
        if (node.status === "running") {
            if (!refs.has(node.id)) {
                refs.set(node.id, React.createRef());
            }
        }
        if (node.children) {
            collectRunningRefs(node.children, refs, depth + 1, maxDepth);
        }
    }
}
export const OperationTree = React.memo(function OperationTree(rawProps) {
    const colors = useColors();
    const STATUS_COLORS = getStatusColors(colors);
    const props = usePluginProps("OperationTree", rawProps);
    const { nodes, maxDepth, showDuration = true, spinnerFrames, spinnerInterval, statusIcons: statusIconsOverride, treeConnectors } = props;
    const effectiveSpinnerFrames = spinnerFrames ?? SPINNER_FRAMES;
    const effectiveSpinnerInterval = spinnerInterval ?? SPINNER_INTERVAL;
    const effectiveStatusIcons = statusIconsOverride
        ? { ...STATUS_ICONS, ...statusIconsOverride }
        : STATUS_ICONS;
    const connBranch = treeConnectors?.branch ?? "\u251C\u2500";
    const connLast = treeConnectors?.last ?? "\u2514\u2500";
    const connPipe = treeConnectors?.pipe ?? "\u2502  ";
    const connSpace = treeConnectors?.space ?? "   ";
    const { requestRender } = useTui();
    const frameRef = useRef(0);
    const spinnerRefsMap = useRef(new Map());
    // Clean up stale refs for nodes no longer in the tree
    const allNodeIds = new Set();
    function collectAllIds(nodeList) {
        for (const node of nodeList) {
            allNodeIds.add(node.id);
            if (node.children)
                collectAllIds(node.children);
        }
    }
    collectAllIds(nodes);
    for (const id of spinnerRefsMap.current.keys()) {
        if (!allNodeIds.has(id)) {
            spinnerRefsMap.current.delete(id);
        }
    }
    collectRunningRefs(nodes, spinnerRefsMap.current, 0, maxDepth);
    const anyRunning = hasRunningNode(nodes);
    // Animate spinner — only when running nodes exist.
    const timerRef = useRef(null);
    if (anyRunning && !timerRef.current) {
        timerRef.current = setInterval(() => {
            // Only animate if there are refs pointing to live text nodes
            let updated = false;
            frameRef.current = (frameRef.current + 1) % effectiveSpinnerFrames.length;
            const frame = effectiveSpinnerFrames[frameRef.current];
            for (const ref of spinnerRefsMap.current.values()) {
                if (ref.current) {
                    ref.current.text = frame;
                    updated = true;
                }
            }
            if (updated)
                requestRender();
        }, effectiveSpinnerInterval);
    }
    else if (!anyRunning && timerRef.current) {
        // Stop timer when no nodes are running
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
    useCleanup(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    });
    function renderNodes(nodeList, depth, parentPrefix) {
        if (maxDepth !== undefined && depth >= maxDepth)
            return [];
        const elements = [];
        for (let i = 0; i < nodeList.length; i++) {
            const node = nodeList[i];
            const isLast = i === nodeList.length - 1;
            const connector = isLast ? connLast : connBranch;
            const childPrefix = parentPrefix + (isLast ? connSpace : connPipe);
            if (props.renderNode) {
                elements.push(React.createElement(React.Fragment, { key: node.id }, props.renderNode(node, { depth })));
                if (node.children && node.children.length > 0) {
                    elements.push(...renderNodes(node.children, depth + 1, childPrefix));
                }
                continue;
            }
            const lineChildren = [];
            // Prefix
            if (depth > 0 || nodeList.length > 1 || parentPrefix.length > 0) {
                lineChildren.push(React.createElement("tui-text", { key: "prefix", color: colors.text.disabled }, parentPrefix + connector + " "));
            }
            // Status icon
            if (node.status === "running") {
                const ref = spinnerRefsMap.current.get(node.id) ?? React.createRef();
                spinnerRefsMap.current.set(node.id, ref);
                lineChildren.push(React.createElement("tui-text", { key: "icon", color: colors.tool.running, _textNodeRef: ref }, effectiveSpinnerFrames[frameRef.current]));
            }
            else {
                const icon = effectiveStatusIcons[node.status] ?? "○";
                const color = STATUS_COLORS[node.status];
                lineChildren.push(React.createElement("tui-text", { key: "icon", ...(color ? { color } : {}) }, icon));
            }
            // Label — running nodes are brighter, completed/pending are dim
            const labelColor = node.status === "running" ? colors.text.primary : colors.text.dim;
            lineChildren.push(React.createElement("tui-text", { key: "label", color: labelColor }, ` ${node.label}`));
            // Detail
            if (node.detail) {
                lineChildren.push(React.createElement("tui-text", { key: "detail", dim: true }, ` ${node.detail}`));
            }
            // Duration
            if (showDuration && node.durationMs !== undefined) {
                const formatted = fmtDuration(node.durationMs);
                lineChildren.push(React.createElement("tui-text", { key: "duration", dim: true, color: colors.brand.light }, ` (${formatted})`));
            }
            elements.push(React.createElement("tui-text", { key: node.id }, ...lineChildren));
            // Children
            if (node.children && node.children.length > 0) {
                elements.push(...renderNodes(node.children, depth + 1, childPrefix));
            }
        }
        return elements;
    }
    return React.createElement("tui-box", { flexDirection: "column" }, ...renderNodes(nodes, 0, ""));
});
//# sourceMappingURL=OperationTree.js.map