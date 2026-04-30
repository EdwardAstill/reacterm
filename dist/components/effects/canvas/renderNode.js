import React from "react";
import { colors as defaultColors } from "../../../theme/colors.js";
import { resolveNodeColor, getSiblingEdges } from "./canvasUtils.js";
const MAX_DEPTH = 20;
const LINE_CHARS = {
    solid: "\u2500", // ─
    dashed: "\u2504", // ┄
    dotted: "\u254C", // ╌
};
const VERT_LINE_CHARS = {
    solid: "\u2502", // │
    dashed: "\u2506", // ┆
    dotted: "\u250A", // ┊
};
function renderConnector(edge, direction, gap, c = defaultColors) {
    if (!edge)
        return null;
    const style = edge.style ?? "solid";
    const edgeColor = edge.color ?? c.text.dim;
    if (direction === "horizontal") {
        const lineChar = LINE_CHARS[style] ?? LINE_CHARS["solid"];
        const line = lineChar.repeat(Math.max(1, gap - 1)) + "\u25B8"; // ▸
        const elements = [];
        if (edge.label) {
            elements.push(React.createElement("tui-text", { key: "label", color: edgeColor, dim: true }, edge.label));
        }
        elements.push(React.createElement("tui-text", { key: "line", color: edgeColor }, line));
        return React.createElement("tui-box", {
            key: `edge-${edge.from}-${edge.to}`,
            flexDirection: "column",
            justifyContent: "center",
        }, ...elements);
    }
    const lineChar = VERT_LINE_CHARS[style] ?? VERT_LINE_CHARS["solid"];
    return React.createElement("tui-box", {
        key: `edge-${edge.from}-${edge.to}`,
        flexDirection: "column",
        alignItems: "center",
    }, React.createElement("tui-text", { color: edgeColor }, lineChar), ...(edge.label ? [React.createElement("tui-text", { key: "l", color: edgeColor, dim: true }, ` ${edge.label} `)] : []), React.createElement("tui-text", { color: edgeColor }, "\u25BE"));
}
export function renderCanvasNode(node, allEdges, nodeIndex, depth, colors) {
    const c = colors ?? defaultColors;
    if (depth > MAX_DEPTH) {
        return React.createElement("tui-text", { key: node.id, dim: true }, "[max depth]");
    }
    const nodeColor = resolveNodeColor(node, c);
    const direction = node.direction ?? "vertical";
    switch (node.type) {
        case "text":
            return React.createElement("tui-text", {
                key: node.id,
                color: node.color ?? c.text.primary,
                bold: node.bold,
                dim: node.dim,
                wrap: "truncate",
            }, (node.icon ? node.icon + " " : "") + (node.label ?? ""));
        case "badge":
            return React.createElement("tui-box", { key: node.id, flexDirection: "row" }, React.createElement("tui-text", {
                color: nodeColor,
                bold: true,
            }, `[${node.label ?? ""}]`));
        case "divider":
            return React.createElement("tui-text", {
                key: node.id,
                color: node.color ?? c.divider,
                dim: true,
                wrap: "truncate",
            }, (node.label ? `── ${node.label} ` : "") + "─".repeat(200));
        case "box":
        case "container": {
            const childElements = [];
            const children = node.children ?? [];
            const siblingEdges = getSiblingEdges(node.id, allEdges, nodeIndex);
            const gap = node.gap ?? 1;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                childElements.push(renderCanvasNode(child, allEdges, nodeIndex, depth + 1, c));
                if (i < children.length - 1) {
                    const nextChild = children[i + 1];
                    const edge = siblingEdges.get(`${child.id}->${nextChild.id}`);
                    const connector = renderConnector(edge, direction, gap, c);
                    if (connector) {
                        childElements.push(connector);
                    }
                }
            }
            // Title row with optional status indicator
            const titleElements = [];
            if (node.label || node.status) {
                const titleParts = [];
                // Status dot before icon/label
                if (node.status) {
                    const statusChar = node.status === "running" ? "\u25D0" : "\u25CF"; // ◐ spinning or ● solid
                    titleParts.push(React.createElement("tui-text", { key: "status", color: nodeColor }, statusChar + " "));
                }
                if (node.icon && !node.status) {
                    titleParts.push(React.createElement("tui-text", { key: "icon", color: nodeColor }, node.icon + " "));
                }
                if (node.label) {
                    titleParts.push(React.createElement("tui-text", { key: "label", bold: true, color: c.text.primary, wrap: "truncate" }, node.label));
                }
                // Sublabel on its own line for box nodes (prevents overflow in narrow layouts)
                titleElements.push(React.createElement("tui-box", { key: "__title", flexDirection: "row" }, ...titleParts));
                if (node.sublabel) {
                    titleElements.push(React.createElement("tui-text", { key: "__sub", dim: true, color: c.text.secondary, wrap: "truncate" }, node.sublabel));
                }
            }
            const borderStyle = node.borderStyle ?? "round";
            const hasTitle = titleElements.length > 0;
            // When a title is present alongside horizontal children, the outer box
            // must stack: title rows on top, children in a separate row underneath.
            // Otherwise the title shares a row with the children and gets clipped.
            const outerDirection = hasTitle && direction === "horizontal" ? "column" : (direction === "horizontal" ? "row" : "column");
            const splitForTitle = hasTitle && direction === "horizontal";
            const boxProps = {
                key: node.id,
                flexDirection: outerDirection,
                ...(borderStyle !== "none" ? { borderStyle, borderColor: nodeColor } : {}),
                ...(!splitForTitle && node.gap !== undefined ? { gap: node.gap } : {}),
                ...(node.padding !== undefined ? { padding: node.padding } : {}),
                ...(node.paddingX !== undefined ? { paddingX: node.paddingX } : {}),
                ...(node.paddingY !== undefined ? { paddingY: node.paddingY } : {}),
                ...(node.width !== undefined ? { width: node.width } : {}),
                ...(node.minWidth !== undefined ? { minWidth: node.minWidth } : {}),
                ...(node.flex !== undefined ? { flex: node.flex } : {}),
                ...(node.backgroundColor !== undefined ? { backgroundColor: node.backgroundColor } : {}),
            };
            // Default padding for bordered containers
            if (borderStyle !== "none") {
                if (node.padding === undefined && node.paddingX === undefined) {
                    if (boxProps.paddingLeft === undefined)
                        boxProps.paddingLeft = 1;
                    if (boxProps.paddingRight === undefined)
                        boxProps.paddingRight = 1;
                }
            }
            if (splitForTitle) {
                const innerProps = {
                    key: "__children",
                    flexDirection: "row",
                    ...(node.gap !== undefined ? { gap: node.gap } : {}),
                };
                const innerBox = React.createElement("tui-box", innerProps, ...childElements);
                return React.createElement("tui-box", boxProps, ...titleElements, innerBox);
            }
            return React.createElement("tui-box", boxProps, ...titleElements, ...childElements);
        }
        default:
            return React.createElement("tui-text", { key: node.id, dim: true }, `[unknown: ${node.type}]`);
    }
}
//# sourceMappingURL=renderNode.js.map