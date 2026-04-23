import React, { useRef, useCallback } from "react";
import { useInput } from "../../hooks/useInput.js";
import { useTui } from "../../context/TuiContext.js";
import { useColors } from "../../hooks/useColors.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { usePersonality } from "../../core/personality.js";
import { useMouseTarget } from "../../hooks/useMouseTarget.js";
const MAX_TREE_DEPTH = 100;
/** Collect visible nodes in display order, flattened with depth/position info. */
function flattenVisible(nodes, depth, parentIsLast) {
    if (depth >= MAX_TREE_DEPTH)
        return [];
    const result = [];
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const isLast = i === nodes.length - 1;
        result.push({ node, depth, isLast, parentIsLast: [...parentIsLast] });
        const hasChildren = node.children !== undefined && node.children.length > 0;
        if (hasChildren && node.expanded) {
            result.push(...flattenVisible(node.children, depth + 1, [...parentIsLast, isLast]));
        }
    }
    return result;
}
/** Derive visible keys from a flat node list. */
function collectVisibleKeysFromFlat(flatNodes) {
    return flatNodes.map((fn) => fn.node.key);
}
/** Build a lookup map from a flat node list. */
function buildNodeMap(flatNodes) {
    const map = new Map();
    for (const fn of flatNodes) {
        map.set(fn.node.key, fn.node);
    }
    return map;
}
function buildPrefix(entry) {
    let prefix = "";
    for (let d = 0; d < entry.depth; d++) {
        if (entry.parentIsLast[d]) {
            prefix += "   ";
        }
        else {
            prefix += "\u2502  "; // │
        }
    }
    if (entry.depth > 0) {
        prefix =
            prefix.slice(0, -3) +
                (entry.isLast ? "\u2514\u2500\u2500" : "\u251C\u2500\u2500"); // └── or ├──
    }
    return prefix;
}
export const Tree = React.memo(function Tree(rawProps) {
    const colors = useColors();
    const personality = usePersonality();
    const props = usePluginProps("Tree", rawProps);
    const { nodes, onToggle, onSelect, selectedKey, onHighlightChange, color = colors.brand.primary, isFocused = false, maxVisible, } = props;
    const { requestRender } = useTui();
    const highlightRef = useRef(0);
    const scrollOffsetRef = useRef(0);
    if (nodes.length === 0) {
        return React.createElement("tui-text", { color: colors.text.dim, dim: true }, "No items");
    }
    const flatNodes = flattenVisible(nodes, 0, []);
    const visibleKeys = collectVisibleKeysFromFlat(flatNodes);
    const nodeMap = buildNodeMap(flatNodes);
    const selectedIndex = selectedKey !== undefined
        ? flatNodes.findIndex((entry) => entry.node.key === selectedKey)
        : -1;
    if (selectedIndex >= 0) {
        highlightRef.current = selectedIndex;
    }
    // Clamp highlight index
    if (highlightRef.current >= flatNodes.length) {
        highlightRef.current = Math.max(0, flatNodes.length - 1);
    }
    if (highlightRef.current < 0) {
        highlightRef.current = 0;
    }
    // Virtual scrolling
    const useVirtualScroll = maxVisible !== undefined && flatNodes.length > maxVisible;
    if (useVirtualScroll) {
        // Keep highlight visible within scroll window
        if (highlightRef.current < scrollOffsetRef.current) {
            scrollOffsetRef.current = highlightRef.current;
        }
        else if (highlightRef.current >= scrollOffsetRef.current + maxVisible) {
            scrollOffsetRef.current = highlightRef.current - maxVisible + 1;
        }
        // Clamp scroll offset
        const maxOffset = Math.max(0, flatNodes.length - maxVisible);
        if (scrollOffsetRef.current > maxOffset)
            scrollOffsetRef.current = maxOffset;
        if (scrollOffsetRef.current < 0)
            scrollOffsetRef.current = 0;
    }
    else {
        scrollOffsetRef.current = 0;
    }
    const setHighlight = useCallback((index, shouldRender = true) => {
        if (index < 0 || index >= flatNodes.length)
            return;
        highlightRef.current = index;
        const node = flatNodes[index]?.node;
        if (node) {
            onHighlightChange?.(node.key, node);
        }
        if (shouldRender)
            requestRender();
    }, [flatNodes, onHighlightChange, requestRender]);
    const triggerSelect = useCallback((index) => {
        const node = flatNodes[index]?.node;
        if (!node)
            return;
        onSelect?.(node.key, node);
    }, [flatNodes, onSelect]);
    const handleInput = useCallback((event) => {
        if (visibleKeys.length === 0)
            return;
        if (event.key === "up") {
            if (highlightRef.current > 0) {
                setHighlight(highlightRef.current - 1);
            }
        }
        else if (event.key === "down") {
            if (highlightRef.current < visibleKeys.length - 1) {
                setHighlight(highlightRef.current + 1);
            }
        }
        else if (event.key === "left") {
            // Collapse current node
            const key = visibleKeys[highlightRef.current];
            if (key) {
                const node = nodeMap.get(key);
                if (node && node.expanded && node.children && node.children.length > 0) {
                    onToggle?.(key);
                    requestRender();
                }
            }
        }
        else if (event.key === "right") {
            // Expand current node
            const key = visibleKeys[highlightRef.current];
            if (key) {
                const node = nodeMap.get(key);
                if (node && !node.expanded && node.children && node.children.length > 0) {
                    onToggle?.(key);
                    requestRender();
                }
            }
        }
        else if (event.key === "return" || event.key === "space") {
            if (onSelect) {
                triggerSelect(highlightRef.current);
            }
            else {
                const key = visibleKeys[highlightRef.current];
                if (key) {
                    onToggle?.(key);
                    requestRender();
                }
            }
        }
    }, [visibleKeys, nodeMap, onToggle, onSelect, requestRender, setHighlight, triggerSelect]);
    useInput(handleInput, { isActive: isFocused });
    const visibleStart = scrollOffsetRef.current;
    const visibleEnd = useVirtualScroll
        ? Math.min(scrollOffsetRef.current + maxVisible, flatNodes.length)
        : flatNodes.length;
    const topOverflowRows = useVirtualScroll && visibleStart > 0 ? 1 : 0;
    const mouseTarget = useMouseTarget({
        disabled: flatNodes.length === 0,
        onMouse: (event, localX, localY) => {
            if (event.button !== "left" || event.action !== "press")
                return;
            let rowOffset = localY;
            if (topOverflowRows === 1) {
                if (rowOffset === 0)
                    return;
                rowOffset -= 1;
            }
            if (rowOffset < 0)
                return;
            const visibleCount = visibleEnd - visibleStart;
            if (rowOffset >= visibleCount)
                return;
            const index = visibleStart + rowOffset;
            const entry = flatNodes[index];
            if (!entry)
                return;
            setHighlight(index, false);
            const hasChildren = !!entry.node.children?.length;
            if (!props.renderNode && hasChildren) {
                const prefix = buildPrefix(entry);
                const markerStart = prefix.length;
                if (localX >= markerStart && localX < markerStart + 2) {
                    onToggle?.(entry.node.key);
                    requestRender();
                    return;
                }
            }
            if (onSelect) {
                triggerSelect(index);
            }
            else if (!props.renderNode && hasChildren) {
                onToggle?.(entry.node.key);
            }
            requestRender();
        },
    });
    const allElements = [];
    // Overflow indicator at top
    if (useVirtualScroll && visibleStart > 0) {
        allElements.push(React.createElement("tui-text", { key: "__scroll-up", color: colors.text.dim, dim: true }, `  \u25B2 ${visibleStart} more above`));
    }
    for (let i = visibleStart; i < visibleEnd; i++) {
        const entry = flatNodes[i];
        const isActive = i === highlightRef.current;
        const isHighlighted = isFocused && isActive;
        const isSelected = selectedIndex >= 0 && i === selectedIndex;
        const hasChildren = entry.node.children !== undefined && entry.node.children.length > 0;
        const prefix = buildPrefix(entry);
        // Expand/collapse marker
        const marker = hasChildren
            ? entry.node.expanded
                ? "\u25BE" // ▾
                : "\u25B8" // ▸
            : " ";
        const parts = [];
        // Tree connector
        if (prefix) {
            parts.push(React.createElement("tui-text", { key: "prefix", color: colors.divider }, prefix));
        }
        // Expand/collapse marker
        parts.push(React.createElement("tui-text", { key: "marker", color }, marker + " "));
        // Optional icon
        if (entry.node.icon !== undefined) {
            parts.push(React.createElement("tui-text", { key: "icon" }, entry.node.icon + " "));
        }
        if (props.renderNode) {
            allElements.push(React.createElement("tui-box", { key: entry.node.key, flexDirection: "row" }, props.renderNode(entry.node, {
                isExpanded: !!entry.node.expanded,
                isHighlighted,
                isSelected,
                depth: entry.depth,
            })));
        }
        else {
            // Label
            parts.push(React.createElement("tui-text", {
                key: "label",
                ...(isHighlighted
                    ? { bold: true, inverse: personality.interaction.focusIndicator === "highlight", color }
                    : isSelected
                        ? { bold: true, color: colors.text.primary }
                        : {}),
            }, entry.node.label));
            allElements.push(React.createElement("tui-box", { key: entry.node.key, flexDirection: "row" }, ...parts));
        }
    }
    // Overflow indicator at bottom
    if (useVirtualScroll && visibleEnd < flatNodes.length) {
        allElements.push(React.createElement("tui-text", { key: "__scroll-down", color: colors.text.dim, dim: true }, `  \u25BC ${flatNodes.length - visibleEnd} more below`));
    }
    return React.createElement("tui-box", { role: "tree", flexDirection: "column", _focusId: mouseTarget.focusId }, ...allElements);
});
//# sourceMappingURL=Tree.js.map