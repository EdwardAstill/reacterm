import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useInput } from "../../hooks/useInput.js";
import { useTui } from "../../context/TuiContext.js";
import { useColors } from "../../hooks/useColors.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { usePersonality } from "../../core/personality.js";
import { useMouseTarget } from "../../hooks/useMouseTarget.js";
import { padEndCells } from "../../core/unicode.js";
import { reorderReducer, initialReorderState, } from "./treeReorderReducer.js";
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
            prefix += "│  "; // │
        }
    }
    if (entry.depth > 0) {
        prefix =
            prefix.slice(0, -3) +
                (entry.isLast ? "└──" : "├──"); // └── or ├──
    }
    return prefix;
}
export const Tree = React.memo(function Tree(rawProps) {
    const colors = useColors();
    const personality = usePersonality();
    const props = usePluginProps("Tree", rawProps);
    const { nodes, onToggle, onSelect, selectedKey, onHighlightChange, color = colors.brand.primary, isFocused = false, maxVisible, reorderable = false, canMove, onReorder, onStateChange, controller: controllerProp, } = props;
    const { requestRender } = useTui();
    const highlightRef = useRef(0);
    const scrollOffsetRef = useRef(0);
    // Reorder state: useState drives re-renders; stateRef mirrors the current
    // phase synchronously so controller methods invoked back-to-back outside of
    // the React lifecycle see fresh values (setState is batched / async).
    const [reorderState, setReorderStateBase] = useState(initialReorderState);
    const stateRef = useRef(reorderState);
    const scratchRef = useRef(undefined);
    const ephemeralRef = useRef(undefined);
    const nodesRef = useRef(nodes);
    const onStateChangeRef = useRef(onStateChange);
    const setReorderState = useCallback((next) => {
        const prev = stateRef.current;
        stateRef.current = next;
        setReorderStateBase(next);
        if (prev !== next) {
            onStateChangeRef.current?.(next);
        }
    }, []);
    // External nodes-prop change while grabbed → abort grab.
    if (reorderable && nodesRef.current !== nodes && reorderState.phase === "grabbed") {
        scratchRef.current = undefined;
        ephemeralRef.current = undefined;
        // Defer state update to after render; do not mutate during render.
        // Using a microtask-style flip via setState in an effect is cleanest.
        // Handled via the effect below.
    }
    // Sync phase -> idle when nodes change during grab.
    useEffect(() => {
        if (!reorderable)
            return;
        if (nodesRef.current !== nodes && reorderState.phase === "grabbed") {
            scratchRef.current = undefined;
            ephemeralRef.current = undefined;
            setReorderState({ phase: "idle" });
        }
        nodesRef.current = nodes;
    }, [nodes, reorderable, reorderState.phase]);
    // Refresh onStateChange handler ref AFTER the nodes-change effect runs, so
    // abort-grab on rerender surfaces via the handler that was active when grab began.
    useEffect(() => {
        onStateChangeRef.current = onStateChange;
    }, [onStateChange]);
    // Effective nodes: scratch when grabbed (and present), else prop nodes.
    const effectiveNodes = reorderable && reorderState.phase === "grabbed" && scratchRef.current !== undefined
        ? scratchRef.current
        : nodes;
    // Flat + derived structures (computed every render; cheap for typical trees).
    const flatNodes = flattenVisible(effectiveNodes, 0, []);
    const visibleKeys = collectVisibleKeysFromFlat(flatNodes);
    const nodeMap = buildNodeMap(flatNodes);
    const selectedIndex = selectedKey !== undefined
        ? flatNodes.findIndex((entry) => entry.node.key === selectedKey)
        : -1;
    // Bundle fresh values for controller methods to read on every invocation.
    const liveRef = useRef({
        nodes,
        visibleKeys,
        flatNodes,
        canMove,
        onReorder,
    });
    liveRef.current = {
        nodes,
        visibleKeys,
        flatNodes,
        canMove,
        onReorder,
    };
    const dispatchAction = useCallback((action) => {
        const live = liveRef.current;
        const step = reorderReducer(stateRef.current, action, live.nodes, live.canMove, scratchRef.current, ephemeralRef.current);
        if (step.rejected) {
            return { rejected: true };
        }
        // Update scratch + ephemeral refs based on step.
        if (step.state.phase === "grabbed") {
            if (step.scratchNodes !== undefined) {
                scratchRef.current = step.scratchNodes;
            }
            // Only overwrite ephemeral when reducer returns one explicitly.
            if (step.ephemeralExpanded !== undefined) {
                ephemeralRef.current = step.ephemeralExpanded;
            }
        }
        else {
            // Transition out of grabbed: clear scratch + ephemeral.
            scratchRef.current = undefined;
            ephemeralRef.current = undefined;
        }
        setReorderState(step.state);
        return step.change !== undefined ? { change: step.change } : {};
    }, []);
    const getCursorKey = useCallback(() => {
        const live = liveRef.current;
        return live.visibleKeys[highlightRef.current] ?? null;
    }, []);
    // Build stable controller handle; read fresh state via liveRef.
    const controller = useRef(null);
    if (controller.current === null) {
        controller.current = {
            toggleMark(key) {
                dispatchAction({ type: "toggleMark", key });
            },
            clearMarks() {
                dispatchAction({ type: "clearMarks" });
            },
            getMarked() {
                const s = stateRef.current;
                return s.phase === "marking" ? [...s.marked] : [];
            },
            grabLive(key) {
                const k = key ?? getCursorKey();
                if (!k)
                    return false;
                const result = dispatchAction({ type: "grabLive", key: k });
                return !result.rejected;
            },
            grabStash() {
                const cursorKey = getCursorKey() ?? "";
                const result = dispatchAction({ type: "grabStash", cursorKey });
                return !result.rejected;
            },
            commit() {
                const cursorKey = getCursorKey() ?? "";
                const { change } = dispatchAction({ type: "commit", cursorKey });
                if (change) {
                    liveRef.current.onReorder?.(change);
                }
            },
            cancel() {
                dispatchAction({ type: "cancel" });
            },
            moveUp() {
                dispatchAction({ type: "moveUp" });
            },
            moveDown() {
                dispatchAction({ type: "moveDown" });
            },
            indent() {
                dispatchAction({ type: "indent" });
            },
            outdent() {
                dispatchAction({ type: "outdent" });
            },
            getCursorKey,
        };
    }
    // Publish controller handle to the consumer's ref-holding prop.
    useLayoutEffect(() => {
        if (!reorderable || !controllerProp)
            return;
        controllerProp.current = controller.current;
        return () => {
            if (controllerProp.current === controller.current) {
                controllerProp.current = null;
            }
        };
    }, [reorderable, controllerProp]);
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
    if (nodes.length === 0) {
        return React.createElement("tui-text", { color: colors.text.dim, dim: true }, "No items");
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
        // Gate native nav keys during grabbed; app owns those through controller.
        if (reorderState.phase === "grabbed") {
            if (event.key === "up" ||
                event.key === "down" ||
                event.key === "left" ||
                event.key === "right" ||
                event.key === "space" ||
                event.key === "return") {
                return;
            }
        }
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
    }, [visibleKeys, nodeMap, onToggle, onSelect, requestRender, setHighlight, triggerSelect, reorderState.phase]);
    useInput(handleInput, { isActive: isFocused });
    const visibleStart = scrollOffsetRef.current;
    const visibleEnd = useVirtualScroll
        ? Math.min(scrollOffsetRef.current + maxVisible, flatNodes.length)
        : flatNodes.length;
    const topOverflowRows = useVirtualScroll && visibleStart > 0 ? 1 : 0;
    const mouseTarget = useMouseTarget({
        disabled: flatNodes.length === 0,
        onMouse: (event, localX, localY) => {
            // During grab, target still registers for layout/focus but clicks are no-ops.
            if (reorderState.phase === "grabbed")
                return;
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
    // Compute mark + moving sets for renderNode flags.
    const markedSet = reorderState.phase === "marking" ? new Set(reorderState.marked) : null;
    const movingSet = reorderState.phase === "grabbed" ? new Set(reorderState.moving) : null;
    const allElements = [];
    // Overflow indicator at top
    if (useVirtualScroll && visibleStart > 0) {
        allElements.push(React.createElement("tui-text", { key: "__scroll-up", color: colors.text.dim, dim: true }, `  ▲ ${visibleStart} more above`));
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
                ? "▾" // ▾
                : "▸" // ▸
            : " ";
        const parts = [];
        // Tree connector
        if (prefix) {
            parts.push(React.createElement("tui-text", { key: "prefix", color: colors.divider }, prefix));
        }
        // Expand/collapse marker
        parts.push(React.createElement("tui-text", { key: "marker", color }, marker + " "));
        // Optional icon — pad slot cell-aware so wide emoji and narrow glyphs
        // both leave the label aligned at the same column.
        if (entry.node.icon !== undefined) {
            parts.push(React.createElement("tui-text", { key: "icon" }, padEndCells(entry.node.icon, 2) + " "));
        }
        const isMarked = markedSet?.has(entry.node.key) ?? false;
        const isGrabbed = movingSet?.has(entry.node.key) ?? false;
        if (props.renderNode) {
            allElements.push(React.createElement("tui-box", { key: entry.node.key, flexDirection: "row" }, props.renderNode(entry.node, {
                isExpanded: !!entry.node.expanded,
                isHighlighted,
                isSelected,
                depth: entry.depth,
                isMarked,
                isGrabbed,
                isDropTarget: false,
            })));
        }
        else {
            // Reorder-aware label rendering.
            const grabbedMode = reorderState.phase === "grabbed" ? reorderState.mode : null;
            const isLiveGrabbed = isGrabbed && grabbedMode === "live";
            const isStashGrabbed = isGrabbed && grabbedMode === "stash";
            let labelText = entry.node.label;
            let labelProps = { key: "label" };
            if (isLiveGrabbed) {
                labelProps = { ...labelProps, bold: true, inverse: true };
            }
            else if (isStashGrabbed) {
                labelText = `⋯ ${entry.node.label}`;
                labelProps = { ...labelProps, dim: true, color: colors.text.dim };
            }
            else if (isMarked) {
                labelText = `* ${entry.node.label}`;
                labelProps = { ...labelProps, color: colors.warning };
            }
            else if (isHighlighted) {
                labelProps = {
                    ...labelProps,
                    bold: true,
                    inverse: personality.interaction.focusIndicator === "highlight",
                    color,
                };
            }
            else if (isSelected) {
                labelProps = { ...labelProps, bold: true, color: colors.text.primary };
            }
            parts.push(React.createElement("tui-text", labelProps, labelText));
            allElements.push(React.createElement("tui-box", { key: entry.node.key, flexDirection: "row" }, ...parts));
        }
    }
    // Overflow indicator at bottom
    if (useVirtualScroll && visibleEnd < flatNodes.length) {
        allElements.push(React.createElement("tui-text", { key: "__scroll-down", color: colors.text.dim, dim: true }, `  ▼ ${flatNodes.length - visibleEnd} more below`));
    }
    return React.createElement("tui-box", { role: "tree", flexDirection: "column", _focusId: mouseTarget.focusId }, ...allElements);
});
//# sourceMappingURL=Tree.js.map