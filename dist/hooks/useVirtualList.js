import { useRef, useCallback } from "react";
import { useTui } from "../context/TuiContext.js";
export function useVirtualList(options) {
    const { items, itemHeight = 1, viewportHeight, overscan = 3 } = options;
    const { requestRender } = useTui();
    const scrollTopRef = useRef(0);
    const totalHeight = items.length * itemHeight;
    const maxScroll = Math.max(0, totalHeight - viewportHeight);
    // Clamp scrollTop if content shrunk
    if (scrollTopRef.current > maxScroll) {
        scrollTopRef.current = maxScroll;
    }
    const clamp = (value) => Math.max(0, Math.min(maxScroll, value));
    const scrollTo = useCallback((index) => {
        const target = index * itemHeight;
        scrollTopRef.current = clamp(target);
        requestRender();
    }, [itemHeight, maxScroll, requestRender]);
    const scrollToTop = useCallback(() => {
        scrollTopRef.current = 0;
        requestRender();
    }, [requestRender]);
    const scrollToBottom = useCallback(() => {
        scrollTopRef.current = maxScroll;
        requestRender();
    }, [maxScroll, requestRender]);
    const onScroll = useCallback((delta) => {
        scrollTopRef.current = clamp(scrollTopRef.current + delta);
        requestRender();
    }, [maxScroll, requestRender]);
    const scrollTop = scrollTopRef.current;
    const rawStart = Math.floor(scrollTop / itemHeight);
    const rawEnd = rawStart + Math.ceil(viewportHeight / itemHeight);
    const startIndex = Math.max(0, rawStart - overscan);
    const endIndex = Math.min(items.length - 1, rawEnd + overscan);
    const visibleItems = [];
    for (let i = startIndex; i <= endIndex; i++) {
        visibleItems.push({
            item: items[i],
            index: i,
            offsetY: i * itemHeight - scrollTop,
        });
    }
    return {
        visibleItems,
        totalHeight,
        scrollTop,
        scrollTo,
        scrollToTop,
        scrollToBottom,
        onScroll,
    };
}
//# sourceMappingURL=useVirtualList.js.map