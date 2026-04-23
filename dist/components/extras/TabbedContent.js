import React, { useRef, useCallback, createContext, useContext } from "react";
import { useInput } from "../../hooks/useInput.js";
import { useTui } from "../../context/TuiContext.js";
import { useColors } from "../../hooks/useColors.js";
import { mergeBoxStyles, pickStyleProps } from "../../styles/applyStyles.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
export const TabbedContentContext = createContext(null);
export function useTabbedContentContext() {
    const ctx = useContext(TabbedContentContext);
    if (!ctx)
        throw new Error("TabbedContent sub-components must be used inside TabbedContent.Root");
    return ctx;
}
function TabbedContentRoot({ activeKey, onTabChange, tabColor: tabColorProp, activeTabColor: activeTabColorProp, children, }) {
    const colors = useColors();
    const tabColor = tabColorProp ?? colors.text.dim;
    const activeTabColor = activeTabColorProp ?? colors.brand.primary;
    const { requestRender } = useTui();
    const onTabChangeRef = useRef(onTabChange);
    onTabChangeRef.current = onTabChange;
    const ctx = {
        activeKey,
        setActiveKey: (key) => { onTabChangeRef.current?.(key); requestRender(); },
        tabColor,
        activeTabColor,
    };
    return React.createElement(TabbedContentContext.Provider, { value: ctx }, React.createElement("tui-box", { flexDirection: "column" }, children));
}
function TabbedContentTab({ tabKey, label, children }) {
    const colors = useColors();
    const { activeKey, tabColor, activeTabColor } = useTabbedContentContext();
    const isActive = tabKey === activeKey;
    if (children) {
        return React.createElement("tui-box", { flexDirection: "row" }, children);
    }
    const textProps = {};
    if (isActive) {
        textProps["bold"] = true;
        textProps["color"] = activeTabColor;
    }
    else {
        textProps["color"] = tabColor;
        textProps["dim"] = true;
    }
    return React.createElement("tui-text", textProps, `[ ${label ?? tabKey} ]`);
}
function TabbedContentPanel({ tabKey, children }) {
    const { activeKey } = useTabbedContentContext();
    if (tabKey !== activeKey)
        return null;
    return React.createElement("tui-box", {}, children);
}
const TabbedContentBase = React.memo(function TabbedContent(rawProps) {
    const colors = useColors();
    const props = usePluginProps("TabbedContent", rawProps);
    const { tabs, activeKey, onTabChange, children, tabColor = colors.text.dim, activeTabColor = colors.brand.primary, isFocused = true, } = props;
    const userStyles = pickStyleProps(props);
    const onTabChangeRef = useRef(onTabChange);
    onTabChangeRef.current = onTabChange;
    const tabsRef = useRef(tabs);
    tabsRef.current = tabs;
    const activeKeyRef = useRef(activeKey);
    activeKeyRef.current = activeKey;
    const isFocusedRef = useRef(isFocused);
    isFocusedRef.current = isFocused;
    const handleInput = useCallback((event) => {
        // Only handle arrows when this TabbedContent is focused.
        // This prevents nested TabbedContent from having the outer one
        // always consume Left/Right arrow keys.
        if (!isFocusedRef.current)
            return;
        const currentTabs = tabsRef.current;
        const cb = onTabChangeRef.current;
        if (!cb || currentTabs.length === 0)
            return;
        const currentIndex = currentTabs.findIndex((t) => t.key === activeKeyRef.current);
        const idx = currentIndex >= 0 ? currentIndex : 0;
        // Tab switching uses Left/Right arrows only.
        // Tab key is reserved for focus management (handled by FocusManager).
        if (event.key === "left") {
            const next = idx > 0 ? idx - 1 : currentTabs.length - 1;
            cb(currentTabs[next].key);
        }
        else if (event.key === "right") {
            const next = idx < currentTabs.length - 1 ? idx + 1 : 0;
            cb(currentTabs[next].key);
        }
        else if (event.char && /^[1-9]$/.test(event.char)) {
            // Number keys (1-9) for direct tab selection
            const numIdx = parseInt(event.char, 10) - 1;
            if (numIdx < currentTabs.length) {
                cb(currentTabs[numIdx].key);
            }
        }
    }, []);
    useInput(handleInput, { isActive: isFocused && onTabChange !== undefined });
    const tabElements = [];
    for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        const isActive = tab.key === activeKey;
        if (i > 0) {
            tabElements.push(React.createElement("tui-text", { key: `sep-${i}` }, " "));
        }
        const textProps = { key: tab.key };
        if (isActive) {
            textProps["bold"] = true;
            textProps["color"] = activeTabColor;
        }
        else {
            textProps["color"] = tabColor;
            textProps["dim"] = true;
        }
        tabElements.push(React.createElement("tui-text", textProps, `[ ${tab.label} ]`));
    }
    const tabBar = React.createElement("tui-box", { key: "__tab-bar", flexDirection: "row" }, ...tabElements);
    // Use a raw flat array instead of React.Children.toArray() to preserve
    // positional slots for falsy children (e.g. `{false && <Panel />}`).
    // toArray() strips nulls/booleans which shifts indices and breaks the
    // tabs-to-children index mapping.
    const childArray = Array.isArray(children) ? children.flat() : [children];
    const activeIndex = tabs.findIndex((t) => t.key === activeKey);
    const activeContent = activeIndex >= 0 ? childArray[activeIndex] ?? null : null;
    const contentBox = React.createElement("tui-box", { key: "__content" }, activeContent);
    const boxProps = mergeBoxStyles({ flexDirection: "column", role: "tabpanel" }, userStyles);
    return React.createElement("tui-box", boxProps, tabBar, contentBox);
});
export const TabbedContent = Object.assign(TabbedContentBase, {
    Root: TabbedContentRoot,
    Tab: TabbedContentTab,
    Panel: TabbedContentPanel,
});
//# sourceMappingURL=TabbedContent.js.map