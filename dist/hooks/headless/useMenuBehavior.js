import { useRef, useCallback } from "react";
import { useInput } from "../useInput.js";
import { useForceUpdate } from "../useForceUpdate.js";
import { findNextNavigable as findNextNav, findFirstNavigable as findFirstNav } from "../../utils/navigation.js";
function isNavigable(item) {
    return !item.separator && !item.disabled;
}
function findNextItem(items, from, direction) {
    return findNextNav(items.length, from, direction, (i) => isNavigable(items[i]));
}
function findFirstItem(items) {
    return findFirstNav(items.length, (i) => isNavigable(items[i]));
}
export function useMenuBehavior(options) {
    const { items, onSelect, isActive = true, maxVisible, } = options;
    const forceUpdate = useForceUpdate();
    const activeIndexRef = useRef(findFirstItem(items));
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
    const currentItems = currentItemsRef.current;
    const activeRef = submenuStackRef.current.length === 0 ? activeIndexRef : subActiveIndexRef;
    // Clamp active index
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
            forceUpdate();
        }
        else if (event.key === "down") {
            aRef.current = findNextItem(itms, aRef.current, 1);
            forceUpdate();
        }
        else if (event.key === "return") {
            const item = itms[aRef.current];
            if (item && isNavigable(item)) {
                if (item.children && item.children.length > 0) {
                    submenuStackRef.current.push({ items: itms, activeIndex: aRef.current });
                    currentItemsRef.current = item.children;
                    subActiveIndexRef.current = findFirstItem(item.children);
                    forceUpdate();
                }
                else if (cb) {
                    cb(item.value);
                }
            }
        }
        else if (event.key === "right") {
            const item = itms[aRef.current];
            if (item && item.children && item.children.length > 0 && isNavigable(item)) {
                submenuStackRef.current.push({ items: itms, activeIndex: aRef.current });
                currentItemsRef.current = item.children;
                subActiveIndexRef.current = findFirstItem(item.children);
                forceUpdate();
            }
        }
        else if (event.key === "left" || event.key === "escape") {
            if (submenuStackRef.current.length > 0) {
                const parent = submenuStackRef.current.pop();
                currentItemsRef.current = parent.items;
                if (submenuStackRef.current.length === 0) {
                    activeIndexRef.current = parent.activeIndex;
                }
                else {
                    subActiveIndexRef.current = parent.activeIndex;
                }
                forceUpdate();
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
    }, [forceUpdate]);
    useInput(handleInput, { isActive });
    const currentActiveIdx = activeRef.current;
    const depth = submenuStackRef.current.length;
    let visibleStart = 0;
    let visibleItems = currentItems;
    if (maxVisible !== undefined && currentItems.length > maxVisible) {
        const halfPage = Math.floor(maxVisible / 2);
        visibleStart = Math.max(0, currentActiveIdx - halfPage);
        visibleStart = Math.min(visibleStart, currentItems.length - maxVisible);
        visibleItems = currentItems.slice(visibleStart, visibleStart + maxVisible);
    }
    const breadcrumbs = [];
    for (const frame of submenuStackRef.current) {
        const parentItem = frame.items[frame.activeIndex];
        if (parentItem)
            breadcrumbs.push(parentItem.label);
    }
    const getItemProps = useCallback((visibleIndex) => {
        const globalIndex = visibleStart + visibleIndex;
        const item = visibleItems[visibleIndex];
        return {
            isActive: globalIndex === currentActiveIdx,
            isDisabled: !!item.disabled,
            isSeparator: !!item.separator,
            hasSubmenu: !!(item.children && item.children.length > 0),
            item,
            globalIndex,
        };
    }, [visibleItems, visibleStart, currentActiveIdx]);
    return {
        activeIndex: currentActiveIdx,
        submenuStack: submenuStackRef.current,
        depth,
        currentItems,
        visibleItems,
        visibleOffset: visibleStart,
        breadcrumbs,
        getItemProps,
        menuProps: {
            role: "menu",
        },
    };
}
//# sourceMappingURL=useMenuBehavior.js.map