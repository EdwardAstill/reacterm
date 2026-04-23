export interface VirtualListOptions<T> {
    /** All items in the list */
    items: readonly T[];
    /** Height of each item in rows (default 1) */
    itemHeight?: number;
    /** Visible viewport height in rows */
    viewportHeight: number;
    /** Number of items to render outside viewport (default 3) */
    overscan?: number;
}
export interface VirtualListResult<T> {
    /** Items to actually render (visible + overscan) */
    visibleItems: Array<{
        item: T;
        index: number;
        offsetY: number;
    }>;
    /** Total content height */
    totalHeight: number;
    /** Current scroll offset */
    scrollTop: number;
    /** Scroll to a specific index */
    scrollTo: (index: number) => void;
    /** Scroll to top */
    scrollToTop: () => void;
    /** Scroll to bottom */
    scrollToBottom: () => void;
    /** Handle scroll delta (from mouse wheel) */
    onScroll: (delta: number) => void;
}
export declare function useVirtualList<T>(options: VirtualListOptions<T>): VirtualListResult<T>;
//# sourceMappingURL=useVirtualList.d.ts.map