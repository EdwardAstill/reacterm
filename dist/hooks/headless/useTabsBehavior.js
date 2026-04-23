import { useRef, useCallback } from "react";
import { useInput } from "../useInput.js";
import { findNextNavigable as findNextNav } from "../../utils/navigation.js";
function findNextTab(tabs, fromIndex, direction) {
    return findNextNav(tabs.length, fromIndex, direction, (i) => !tabs[i].disabled, -1);
}
export function useTabsBehavior(options) {
    const { tabs, activeKey, onChange, onClose, isActive = true, orientation = "horizontal", enableArrows = true, enableNumbers = true, enableCloseKeys = true, } = options;
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const tabsRef = useRef(tabs);
    tabsRef.current = tabs;
    const activeKeyRef = useRef(activeKey);
    activeKeyRef.current = activeKey;
    const setActiveKey = useCallback((key) => {
        onChangeRef.current?.(key);
    }, []);
    const handleInput = useCallback((event) => {
        const currentTabs = tabsRef.current;
        const cb = onChangeRef.current;
        if (!cb || currentTabs.length === 0)
            return;
        const currentIndex = currentTabs.findIndex((t) => t.key === activeKeyRef.current);
        const idx = currentIndex >= 0 ? currentIndex : 0;
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
    useInput(handleInput, { isActive });
    const getTriggerProps = useCallback((key) => {
        const tab = tabsRef.current.find((t) => t.key === key);
        return {
            isActive: key === activeKeyRef.current,
            isDisabled: tab?.disabled === true,
            isClosable: tab?.closable === true,
            onSelect: () => {
                if (tab && !tab.disabled) {
                    onChangeRef.current?.(key);
                }
            },
            role: "tab",
        };
    }, []);
    const getPanelProps = useCallback((key) => {
        const isActivePanel = key === activeKeyRef.current;
        return {
            isActive: isActivePanel,
            role: "tabpanel",
            hidden: !isActivePanel,
        };
    }, []);
    return {
        activeKey,
        setActiveKey,
        getTriggerProps,
        getPanelProps,
    };
}
//# sourceMappingURL=useTabsBehavior.js.map