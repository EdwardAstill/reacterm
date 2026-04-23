import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useRef } from "react";
import { Box } from "../../components/core/Box.js";
import { Text } from "../../components/core/Text.js";
import { useInput } from "../../hooks/useInput.js";
import { useTui } from "../../context/TuiContext.js";
import { useColors } from "../../hooks/useColors.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { computeScrollWindow } from "../../utils/navigation.js";
/** Returns indices of matching characters for fuzzy substring match, or null. */
function fuzzyMatch(query, text) {
    const lower = text.toLowerCase();
    const q = query.toLowerCase();
    let qIdx = 0;
    const indices = [];
    for (let i = 0; i < lower.length && qIdx < q.length; i++) {
        if (lower[i] === q[qIdx]) {
            indices.push(i);
            qIdx++;
        }
    }
    return qIdx === q.length ? indices : null;
}
/** Render item name with matching characters highlighted in bold. */
function highlightName(name, matchIndices) {
    const parts = [];
    const matchSet = new Set(matchIndices);
    let i = 0;
    while (i < name.length) {
        if (matchSet.has(i)) {
            let end = i;
            while (end < name.length && matchSet.has(end))
                end++;
            parts.push(React.createElement("tui-text", { key: `m${i}`, bold: true }, name.slice(i, end)));
            i = end;
        }
        else {
            let end = i;
            while (end < name.length && !matchSet.has(end))
                end++;
            parts.push(React.createElement("tui-text", { key: `u${i}` }, name.slice(i, end)));
            i = end;
        }
    }
    return parts;
}
export const CommandDropdown = React.memo(function CommandDropdown(rawProps) {
    const colors = useColors();
    const props = usePluginProps("CommandDropdown", rawProps);
    const { items, selectedIndex = 0, maxVisible = 6, highlightColor = colors.brand.primary, isFocused, onSelect, onSelectionChange, onClose, selectionIndicator, renderItem, } = props;
    const indicator = selectionIndicator ?? "\u25B8 ";
    const { requestRender } = useTui();
    const indexRef = useRef(selectedIndex);
    const filterRef = useRef("");
    // Sync external selectedIndex prop into ref
    indexRef.current = selectedIndex;
    const onSelectionChangeRef = useRef(onSelectionChange);
    onSelectionChangeRef.current = onSelectionChange;
    const filter = filterRef.current;
    const filteredItems = [];
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (filter.length === 0) {
            filteredItems.push({ item, matchIndices: [], originalIndex: i });
        }
        else {
            const indices = fuzzyMatch(filter, item.name);
            if (indices) {
                filteredItems.push({ item, matchIndices: indices, originalIndex: i });
            }
        }
    }
    // Clamp index to filtered range
    if (indexRef.current >= filteredItems.length) {
        indexRef.current = Math.max(0, filteredItems.length - 1);
    }
    // Keyboard handling for navigation, selection, and filtering
    useInput((e) => {
        if (e.key === "escape") {
            if (filterRef.current.length > 0) {
                // First Escape: clear filter
                filterRef.current = "";
                indexRef.current = 0;
                if (onSelectionChangeRef.current)
                    onSelectionChangeRef.current(0);
                requestRender();
            }
            else {
                // Second Escape: close dropdown
                onClose?.();
            }
            return;
        }
        if (e.key === "backspace") {
            if (filterRef.current.length > 0) {
                filterRef.current = filterRef.current.slice(0, -1);
                indexRef.current = 0;
                if (onSelectionChangeRef.current)
                    onSelectionChangeRef.current(0);
                requestRender();
            }
            return;
        }
        if (filteredItems.length === 0)
            return;
        if (e.key === "up") {
            if (indexRef.current > 0) {
                indexRef.current--;
                if (onSelectionChangeRef.current)
                    onSelectionChangeRef.current(indexRef.current);
                requestRender();
            }
        }
        else if (e.key === "down") {
            if (indexRef.current < filteredItems.length - 1) {
                indexRef.current++;
                if (onSelectionChangeRef.current)
                    onSelectionChangeRef.current(indexRef.current);
                requestRender();
            }
        }
        else if (e.key === "return") {
            const selected = filteredItems[indexRef.current];
            if (selected && onSelect) {
                onSelect(selected.item);
            }
        }
        else if (e.key.length === 1 && e.key >= " ") {
            // Type-to-filter: printable characters
            filterRef.current += e.key;
            indexRef.current = 0;
            if (onSelectionChangeRef.current)
                onSelectionChangeRef.current(0);
            requestRender();
        }
    }, { isActive: isFocused === true });
    if (filteredItems.length === 0 && filter.length === 0)
        return null;
    const activeIndex = indexRef.current;
    const { start, end } = computeScrollWindow(filteredItems.length, activeIndex, maxVisible);
    const visibleItems = filteredItems.slice(start, end);
    const hasMoreAbove = start > 0;
    const hasMoreBelow = end < filteredItems.length;
    return (_jsxs(Box, { flexDirection: "column", paddingX: 1, children: [filter.length > 0 && (_jsx(Text, { dim: true, color: colors.brand.primary, children: `filter: ${filter}${filteredItems.length === 0 ? " (no matches)" : ""}` })), hasMoreAbove && _jsx(Text, { dim: true, children: "  ..." }), visibleItems.map((entry, i) => {
                const actualIndex = start + i;
                const isSelected = actualIndex === activeIndex;
                const nameElements = filter.length > 0
                    ? highlightName(entry.item.name, entry.matchIndices)
                    : null;
                if (renderItem) {
                    return (_jsx(Box, { flexDirection: "row", children: renderItem(entry.item, isSelected) }, entry.item.name));
                }
                const unselectedPad = " ".repeat(indicator.length);
                return (_jsxs(Box, { flexDirection: "row", children: [isSelected ? (_jsxs(_Fragment, { children: [_jsx(Text, { color: highlightColor, bold: true, children: indicator }), nameElements
                                    ? React.createElement("tui-text", { color: highlightColor }, ...nameElements)
                                    : _jsx(Text, { color: highlightColor, bold: true, children: entry.item.name })] })) : (_jsxs(_Fragment, { children: [_jsx(Text, { children: unselectedPad }), nameElements
                                    ? React.createElement("tui-text", null, ...nameElements)
                                    : _jsx(Text, { children: entry.item.name })] })), _jsxs(Text, { dim: true, children: [" ", entry.item.description] })] }, entry.item.name));
            }), hasMoreBelow && _jsx(Text, { dim: true, children: "  ..." })] }));
});
//# sourceMappingURL=CommandDropdown.js.map