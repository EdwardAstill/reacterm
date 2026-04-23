import { useRef, useCallback } from "react";
import { useInput } from "../useInput.js";
import { useForceUpdate } from "../useForceUpdate.js";
import { useVirtualList } from "../useVirtualList.js";
export function useVirtualListBehavior(options) {
    const { items, itemHeight = 1, viewportHeight, overscan = 3, selectedIndex: selectedIndexProp, onSelect, isActive = true, } = options;
    const forceUpdate = useForceUpdate();
    const safeItemHeight = Math.max(1, itemHeight);
    const selectedRef = useRef(selectedIndexProp ?? 0);
    if (selectedIndexProp !== undefined) {
        selectedRef.current = selectedIndexProp;
    }
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;
    const virtualList = useVirtualList({
        items,
        itemHeight: safeItemHeight,
        viewportHeight,
        overscan,
    });
    const handleKey = useCallback((event) => {
        if (event.key === "up") {
            selectedRef.current = Math.max(0, selectedRef.current - 1);
            if (selectedRef.current * safeItemHeight < virtualList.scrollTop) {
                virtualList.scrollTo(selectedRef.current);
            }
            forceUpdate();
        }
        else if (event.key === "down") {
            selectedRef.current = Math.min(items.length - 1, selectedRef.current + 1);
            const itemBottom = (selectedRef.current + 1) * safeItemHeight;
            if (itemBottom > virtualList.scrollTop + viewportHeight) {
                virtualList.scrollTo(selectedRef.current - Math.floor(viewportHeight / safeItemHeight) + 1);
            }
            forceUpdate();
        }
        else if (event.key === "return") {
            const item = items[selectedRef.current];
            if (item && onSelectRef.current) {
                onSelectRef.current(item, selectedRef.current);
            }
        }
        else if (event.key === "home") {
            selectedRef.current = 0;
            virtualList.scrollToTop();
            forceUpdate();
        }
        else if (event.key === "end") {
            selectedRef.current = Math.max(0, items.length - 1);
            virtualList.scrollToBottom();
            forceUpdate();
        }
    }, [items, safeItemHeight, viewportHeight, virtualList, forceUpdate]);
    useInput(handleKey, { isActive });
    return {
        visibleRange: virtualList.visibleItems,
        scrollOffset: virtualList.scrollTop,
        selectedIndex: selectedRef.current,
        scrollTo: virtualList.scrollTo,
        scrollToTop: virtualList.scrollToTop,
        scrollToBottom: virtualList.scrollToBottom,
        onScroll: virtualList.onScroll,
        totalHeight: virtualList.totalHeight,
    };
}
//# sourceMappingURL=useVirtualListBehavior.js.map