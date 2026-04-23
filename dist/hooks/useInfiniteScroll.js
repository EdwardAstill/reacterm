import { useRef, useCallback } from "react";
import { useCleanup } from "./useCleanup.js";
import { useForceUpdate } from "./useForceUpdate.js";
export function useInfiniteScroll(options) {
    const { onLoadMore, hasMore, threshold = 5, isActive = true } = options;
    const forceUpdate = useForceUpdate();
    const isLoadingRef = useRef(false);
    const abortedRef = useRef(false);
    // Keep callbacks current
    const onLoadMoreRef = useRef(onLoadMore);
    onLoadMoreRef.current = onLoadMore;
    const hasMoreRef = useRef(hasMore);
    hasMoreRef.current = hasMore;
    const onScroll = useCallback((position, total) => {
        if (!isActive)
            return;
        if (isLoadingRef.current)
            return;
        if (!hasMoreRef.current)
            return;
        if (total <= 0)
            return;
        if (position >= total - threshold) {
            isLoadingRef.current = true;
            forceUpdate();
            onLoadMoreRef.current().then(() => {
                if (abortedRef.current)
                    return;
                isLoadingRef.current = false;
                forceUpdate();
            }, () => {
                if (abortedRef.current)
                    return;
                isLoadingRef.current = false;
                forceUpdate();
            });
        }
    }, [isActive, threshold, forceUpdate]);
    useCleanup(() => {
        abortedRef.current = true;
    });
    return {
        isLoading: isLoadingRef.current,
        onScroll,
    };
}
//# sourceMappingURL=useInfiniteScroll.js.map