import React, { useRef, useCallback, createContext, useContext } from "react";
import { useInput } from "../../hooks/useInput.js";
import { useTui } from "../../context/TuiContext.js";
import { useColors } from "../../hooks/useColors.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { usePersonality } from "../../core/personality.js";
import { pickLayoutProps } from "../../styles/applyStyles.js";
import { findNextNavigable as findNextNav, findFirstNavigable as findFirstNav, computeScrollWindow } from "../../utils/navigation.js";
export const MenuContext = createContext(null);
export function useMenuContext() {
    const ctx = useContext(MenuContext);
    if (!ctx)
        throw new Error("Menu sub-components must be used inside Menu.Root");
    return ctx;
}
function MenuRoot({ onSelect, children }) {
    const colors = useColors();
    const { requestRender } = useTui();
    const activeIndexRef = useRef(0);
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;
    const ctx = {
        activeIndex: activeIndexRef.current,
        setActiveIndex: (idx) => { activeIndexRef.current = idx; requestRender(); },
        onSelect,
    };
    return React.createElement(MenuContext.Provider, { value: ctx }, React.createElement("tui-box", { flexDirection: "column" }, children));
}
function MenuCompoundItem({ value, label, disabled = false, icon, shortcut, children }) {
    const colors = useColors();
    const { onSelect } = useMenuContext();
    const displayLabel = label ?? value;
    const iconPrefix = icon ? `${icon} ` : "";
    if (children) {
        return React.createElement("tui-box", { flexDirection: "row" }, children);
    }
    const elements = [
        React.createElement("tui-text", {
            key: "label",
            color: disabled ? colors.text.disabled : colors.text.primary,
            dim: disabled,
            strikethrough: disabled,
        }, `  ${iconPrefix}${displayLabel}`),
    ];
    if (shortcut) {
        elements.push(React.createElement("tui-text", { key: "shortcut", color: colors.text.dim }, `  ${shortcut}`));
    }
    return React.createElement("tui-box", { flexDirection: "row" }, ...elements);
}
function MenuSeparator({ children }) {
    const colors = useColors();
    if (children) {
        return React.createElement("tui-box", {}, children);
    }
    return React.createElement("tui-text", { color: colors.divider, dim: true }, `  \u2500\u2500\u2500`);
}
function MenuSubmenu({ label, icon, children }) {
    const colors = useColors();
    const iconPrefix = icon ? `${icon} ` : "";
    return React.createElement("tui-box", { flexDirection: "column" }, React.createElement("tui-box", { flexDirection: "row" }, React.createElement("tui-text", { color: colors.text.primary }, `  ${iconPrefix}${label}`), React.createElement("tui-text", { color: colors.text.dim }, ` \u25B6`)), React.createElement("tui-box", { paddingLeft: 2 }, children));
}
const INDICATOR = "\u25B8"; // ▸
const SEPARATOR_LINE = "\u2500\u2500\u2500";
const SUBMENU_ARROW = "\u25B6"; // ▶
function isNavigable(item) {
    return !item.separator && !item.disabled;
}
function findNextItem(items, from, direction) {
    return findNextNav(items.length, from, direction, (i) => isNavigable(items[i]));
}
function findFirstItem(items) {
    return findFirstNav(items.length, (i) => isNavigable(items[i]));
}
const MenuBase = React.memo(function Menu(rawProps) {
    const colors = useColors();
    const personality = usePersonality();
    const props = usePluginProps("Menu", rawProps);
    const { items, onSelect, isFocused = true, color = colors.text.primary, activeColor = colors.brand.primary, maxVisible, } = props;
    const { requestRender } = useTui();
    const activeIndexRef = useRef(findFirstItem(items));
    // Submenu navigation stack: array of { parentItems, parentIndex }
    // currentItems / currentActiveIndex represent the currently active level
    const submenuStackRef = useRef([]);
    const currentItemsRef = useRef(items);
    const subActiveIndexRef = useRef(findFirstItem(items));
    // Refs for latest prop values
    const itemsRef = useRef(items);
    itemsRef.current = items;
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;
    // Sync root items when props change
    if (submenuStackRef.current.length === 0) {
        currentItemsRef.current = items;
    }
    // Clamp active index if items changed
    const currentItems = currentItemsRef.current;
    const activeRef = submenuStackRef.current.length === 0 ? activeIndexRef : subActiveIndexRef;
    if (activeRef.current >= currentItems.length) {
        activeRef.current = findFirstItem(currentItems);
    }
    if (currentItems[activeRef.current] && !isNavigable(currentItems[activeRef.current])) {
        activeRef.current = findNextItem(currentItems, activeRef.current, 1);
    }
    const handleInput = useCallback((event) => {
        const itms = currentItemsRef.current;
        const cb = onSelectRef.current;
        const aRef = submenuStackRef.current.length === 0 ? activeIndexRef : subActiveIndexRef;
        if (event.key === "up") {
            aRef.current = findNextItem(itms, aRef.current, -1);
            requestRender();
        }
        else if (event.key === "down") {
            aRef.current = findNextItem(itms, aRef.current, 1);
            requestRender();
        }
        else if (event.key === "return") {
            const item = itms[aRef.current];
            if (item && isNavigable(item)) {
                // If item has children, open submenu
                if (item.children && item.children.length > 0) {
                    submenuStackRef.current.push({ items: itms, activeIndex: aRef.current });
                    currentItemsRef.current = item.children;
                    subActiveIndexRef.current = findFirstItem(item.children);
                    requestRender();
                }
                else if (cb) {
                    cb(item.value);
                }
            }
        }
        else if (event.key === "right") {
            // Open submenu if current item has children
            const item = itms[aRef.current];
            if (item && item.children && item.children.length > 0 && isNavigable(item)) {
                submenuStackRef.current.push({ items: itms, activeIndex: aRef.current });
                currentItemsRef.current = item.children;
                subActiveIndexRef.current = findFirstItem(item.children);
                requestRender();
            }
        }
        else if (event.key === "left" || event.key === "escape") {
            // Return to parent menu
            if (submenuStackRef.current.length > 0) {
                const parent = submenuStackRef.current.pop();
                currentItemsRef.current = parent.items;
                if (submenuStackRef.current.length === 0) {
                    activeIndexRef.current = parent.activeIndex;
                }
                else {
                    subActiveIndexRef.current = parent.activeIndex;
                }
                requestRender();
            }
        }
        else if (event.char) {
            for (const item of itms) {
                if (item.shortcut &&
                    !item.disabled &&
                    !item.separator &&
                    item.shortcut.toLowerCase() === event.char.toLowerCase()) {
                    cb?.(item.value);
                    break;
                }
            }
        }
    }, []);
    useInput(handleInput, { isActive: isFocused });
    // Empty items — render placeholder after all hooks
    if (items.length === 0) {
        return React.createElement("tui-text", { color: colors.text.dim, dim: true }, "No items");
    }
    const outerBoxProps = {
        role: "menu",
        flexDirection: "column",
        "aria-label": props["aria-label"],
        ...pickLayoutProps(props),
    };
    const depth = submenuStackRef.current.length;
    const indent = "  ".repeat(depth);
    // Breadcrumb trail for submenus
    const breadcrumbs = [];
    if (depth > 0) {
        const trail = [];
        for (const frame of submenuStackRef.current) {
            const parentItem = frame.items[frame.activeIndex];
            if (parentItem)
                trail.push(parentItem.label);
        }
        breadcrumbs.push(React.createElement("tui-text", { key: "__breadcrumb", color: colors.text.dim, dim: true }, trail.join(" > ")));
    }
    const renderItems = currentItemsRef.current;
    const currentActiveIdx = (submenuStackRef.current.length === 0 ? activeIndexRef : subActiveIndexRef).current;
    const { start: visibleStart, end: visibleEnd } = maxVisible !== undefined
        ? computeScrollWindow(renderItems.length, currentActiveIdx, maxVisible)
        : { start: 0, end: renderItems.length };
    const visibleItems = renderItems.slice(visibleStart, visibleEnd);
    const itemElements = visibleItems.map((item, i) => {
        const index = visibleStart + i;
        // Separator line
        if (item.separator) {
            return React.createElement("tui-text", { key: `sep-${index}`, color: colors.divider, dim: true }, `${indent}  ${SEPARATOR_LINE}`);
        }
        const isActive = index === currentActiveIdx;
        const isDisabled = !!item.disabled;
        const hasSubmenu = !!(item.children && item.children.length > 0);
        let textColor;
        if (isDisabled) {
            textColor = colors.text.disabled;
        }
        else if (isActive) {
            textColor = activeColor;
        }
        else {
            textColor = color;
        }
        const indicator = isActive ? `${personality.interaction.selectionChar} ` : "  ";
        const iconPrefix = item.icon ? `${item.icon} ` : "";
        const children = [
            // Indicator + icon + label
            React.createElement("tui-text", {
                key: "label",
                color: textColor,
                bold: isActive,
                dim: isDisabled,
                strikethrough: isDisabled,
            }, `${indent}${indicator}${iconPrefix}${item.label}`),
        ];
        // Submenu arrow indicator
        if (hasSubmenu) {
            children.push(React.createElement("tui-text", { key: "sub", color: colors.text.dim }, ` ${SUBMENU_ARROW}`));
        }
        // Shortcut (right-aligned, dim)
        if (item.shortcut) {
            children.push(React.createElement("tui-text", { key: "shortcut", color: colors.text.dim }, `  ${item.shortcut}`));
        }
        if (props.renderItem) {
            return React.createElement("tui-box", { key: item.value, flexDirection: "row" }, props.renderItem(item, { isActive, isDisabled, hasSubmenu }));
        }
        return React.createElement("tui-box", { key: item.value, flexDirection: "row" }, ...children);
    });
    return React.createElement("tui-box", outerBoxProps, ...breadcrumbs, ...itemElements);
});
export const Menu = Object.assign(MenuBase, {
    Root: MenuRoot,
    Item: MenuCompoundItem,
    Separator: MenuSeparator,
    Submenu: MenuSubmenu,
});
//# sourceMappingURL=Menu.js.map