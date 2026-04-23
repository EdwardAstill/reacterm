import React, { useRef, useCallback, createContext, useContext } from "react";
import { useInput } from "../../hooks/useInput.js";
import { useTui } from "../../context/TuiContext.js";
import { useColors } from "../../hooks/useColors.js";
import { pickStyleProps } from "../../styles/applyStyles.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { findNextNavigable as findNextNav } from "../../utils/navigation.js";
import { useMouseTarget } from "../../hooks/useMouseTarget.js";
function findNextTab(tabs, fromIndex, direction) {
    return findNextNav(tabs.length, fromIndex, direction, (i) => !tabs[i].disabled, -1);
}
export const TabsContext = createContext(null);
export function useTabsContext() {
    const ctx = useContext(TabsContext);
    if (!ctx)
        throw new Error("Tabs sub-components must be used inside Tabs.Root");
    return ctx;
}
function TabsRoot({ activeKey, onActiveKeyChange, orientation = "horizontal", children }) {
    const colors = useColors();
    const { requestRender } = useTui();
    const onChangeRef = useRef(onActiveKeyChange);
    onChangeRef.current = onActiveKeyChange;
    const ctx = {
        activeKey,
        setActiveKey: (key) => { onChangeRef.current?.(key); requestRender(); },
        orientation,
    };
    return React.createElement(TabsContext.Provider, { value: ctx }, children);
}
function TabsTrigger({ tabKey, disabled = false, closable = false, children, color: triggerColor }) {
    const colors = useColors();
    const { activeKey } = useTabsContext();
    const isActive = activeKey === tabKey;
    const effectiveColor = triggerColor ?? colors.brand.primary;
    if (children) {
        return React.createElement("tui-box", { flexDirection: "row" }, children);
    }
    const textProps = {};
    if (disabled) {
        textProps["dim"] = true;
        textProps["color"] = colors.text.disabled;
    }
    else if (isActive) {
        textProps["bold"] = true;
        textProps["color"] = effectiveColor;
    }
    else {
        textProps["dim"] = true;
    }
    const labelText = closable ? `[ ${tabKey} \u00D7 ]` : `[ ${tabKey} ]`;
    return React.createElement("tui-text", textProps, labelText);
}
function TabsPanel({ tabKey, children }) {
    const { activeKey } = useTabsContext();
    if (activeKey !== tabKey)
        return null;
    return React.createElement("tui-box", { flexDirection: "column" }, children);
}
function getTabLabelText(tab, variant) {
    const closableSuffix = tab.closable ? " \u00D7" : "";
    switch (variant) {
        case "plain":
            return `${tab.label}${closableSuffix}`;
        case "pill":
            return ` ${tab.label}${closableSuffix} `;
        case "bracket":
        default:
            return tab.closable ? `[ ${tab.label} \u00D7 ]` : `[ ${tab.label} ]`;
    }
}
const TabsItem = React.memo(function TabsItem({ tab, isActive, isDisabled, onSelect, color, inactiveColor, activeBackgroundColor, inactiveBackgroundColor, variant, renderTab, }) {
    const colors = useColors();
    const mouseTarget = useMouseTarget({
        disabled: isDisabled,
        onMouse: (event) => {
            if (event.button !== "left" || event.action !== "press")
                return;
            onSelect();
        },
    });
    const child = renderTab
        ? renderTab(tab, { isActive, isDisabled })
        : React.createElement("tui-text", {
            color: isDisabled ? colors.text.disabled : isActive ? color : inactiveColor,
            bold: isActive && !isDisabled,
            dim: !isActive || isDisabled,
            ...(isActive && activeBackgroundColor !== undefined ? { backgroundColor: activeBackgroundColor } : {}),
            ...(!isActive && !isDisabled && inactiveBackgroundColor !== undefined ? { backgroundColor: inactiveBackgroundColor } : {}),
        }, getTabLabelText(tab, variant));
    return React.createElement("tui-box", { key: tab.key, _focusId: mouseTarget.focusId, flexDirection: "row" }, child);
});
const TabsBase = React.memo(function Tabs(rawProps) {
    const colors = useColors();
    const props = usePluginProps("Tabs", rawProps);
    const { tabs, activeKey, onChange, onClose, color = colors.brand.primary, inactiveColor = colors.text.dim, activeBackgroundColor, inactiveBackgroundColor, isFocused = true, orientation = "horizontal", variant = "bracket", enableArrows = true, enableNumbers = true, enableCloseKeys = true, } = props;
    const layoutProps = pickStyleProps(props);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const tabsRef = useRef(tabs);
    tabsRef.current = tabs;
    const activeKeyRef = useRef(activeKey);
    activeKeyRef.current = activeKey;
    const handleInput = useCallback((event) => {
        const currentTabs = tabsRef.current;
        const cb = onChangeRef.current;
        if (!cb || currentTabs.length === 0)
            return;
        const currentIndex = currentTabs.findIndex((t) => t.key === activeKeyRef.current);
        const idx = currentIndex >= 0 ? currentIndex : 0;
        // Navigation keys depend on orientation
        const prevKey = orientation === "vertical" ? "up" : "left";
        const nextKey = orientation === "vertical" ? "down" : "right";
        if (enableArrows && event.key === prevKey) {
            const next = findNextTab(currentTabs, idx, -1);
            if (next >= 0)
                cb(currentTabs[next].key);
        }
        else if (enableArrows && event.key === nextKey) {
            const next = findNextTab(currentTabs, idx, 1);
            if (next >= 0)
                cb(currentTabs[next].key);
        }
        else if (enableNumbers && event.char && /^[1-9]$/.test(event.char)) {
            const numIdx = parseInt(event.char, 10) - 1;
            if (numIdx < currentTabs.length && !currentTabs[numIdx].disabled) {
                cb(currentTabs[numIdx].key);
            }
        }
        else if (enableCloseKeys && (event.key === "delete" || event.key === "backspace") && onCloseRef.current) {
            const activeTab = currentTabs[idx];
            if (activeTab && activeTab.closable) {
                onCloseRef.current(activeTab.key);
            }
        }
    }, [enableArrows, enableCloseKeys, enableNumbers, orientation]);
    useInput(handleInput, { isActive: isFocused !== false });
    const tabElements = tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        const isDisabled = tab.disabled === true;
        return React.createElement(TabsItem, {
            key: tab.key,
            tab,
            isActive,
            isDisabled,
            onSelect: () => {
                if (!isDisabled)
                    onChangeRef.current?.(tab.key);
            },
            color,
            inactiveColor,
            activeBackgroundColor,
            inactiveBackgroundColor,
            variant,
            renderTab: props.renderTab,
        });
    });
    // Add separators between tabs
    const children = [];
    const useSeparators = orientation !== "vertical"
        && (layoutProps["gap"] ?? 0) === 0;
    for (let i = 0; i < tabElements.length; i++) {
        children.push(tabElements[i]);
        if (useSeparators && i < tabElements.length - 1) {
            children.push(React.createElement("tui-text", { key: `sep-${i}` }, " "));
        }
    }
    const outerBoxProps = {
        role: "tablist",
        flexDirection: orientation === "vertical" ? "column" : "row",
        "aria-label": props["aria-label"],
        ...layoutProps,
    };
    return React.createElement("tui-box", outerBoxProps, ...children);
});
export const Tabs = Object.assign(TabsBase, {
    Root: TabsRoot,
    Trigger: TabsTrigger,
    Panel: TabsPanel,
});
//# sourceMappingURL=Tabs.js.map