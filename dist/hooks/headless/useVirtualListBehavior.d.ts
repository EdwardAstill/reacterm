export interface UseVirtualListBehaviorOptions<T> {
    items: readonly T[];
    itemHeight?: number;
    viewportHeight: number;
    overscan?: number;
    selectedIndex?: number;
    onSelect?: (item: T, index: number) => void;
    isActive?: boolean;
}
export interface UseVirtualListBehaviorResult<T> {
    /** The visible range of items (with overscan) */
    visibleRange: Array<{
        item: T;
        index: number;
        offsetY: number;
    }>;
    /** Current scroll offset (in rows) */
    scrollOffset: number;
    /** Currently selected index */
    selectedIndex: number;
    /** Scroll to a specific item index */
    scrollTo: (index: number) => void;
    /** Scroll to the first item */
    scrollToTop: () => void;
    /** Scroll to the last item */
    scrollToBottom: () => void;
    /** Handle a scroll delta (from mouse wheel etc.) */
    onScroll: (delta: number) => void;
    /** Total content height */
    totalHeight: number;
}
export declare function useVirtualListBehavior<T>(options: UseVirtualListBehaviorOptions<T>): UseVirtualListBehaviorResult<T>;
//# sourceMappingURL=useVirtualListBehavior.d.ts.map