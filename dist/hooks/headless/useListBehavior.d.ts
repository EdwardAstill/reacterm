export interface ListBehaviorItem {
    key: string;
    label: string;
    description?: string;
    icon?: string;
}
export interface UseListBehaviorOptions {
    items: readonly ListBehaviorItem[];
    selectedKey?: string;
    onSelect?: (key: string) => void;
    onHighlight?: (key: string) => void;
    isActive?: boolean;
    maxVisible?: number;
    initialIndex?: number;
}
export interface UseListBehaviorResult {
    /** Index of the currently highlighted item in the filtered list */
    highlightIndex: number;
    /** Current filter text from type-ahead */
    filterText: string;
    /** Filtered items based on current filter text */
    filteredItems: readonly ListBehaviorItem[];
    /** Visible items after maxVisible windowing */
    visibleItems: readonly ListBehaviorItem[];
    /** Offset of visible window into filteredItems */
    visibleOffset: number;
    /** Whether there are hidden items above the visible window */
    hasOverflowTop: boolean;
    /** Whether there are hidden items below the visible window */
    hasOverflowBottom: boolean;
    /** Total count of all items (unfiltered) */
    totalCount: number;
    /** Props for the highlighted item's container */
    highlightProps: {
        index: number;
        key: string | undefined;
    };
    /** Get props for each item by its index in the visible list */
    getItemProps: (visibleIndex: number) => {
        isHighlighted: boolean;
        item: ListBehaviorItem;
        globalIndex: number;
    };
}
export declare function useListBehavior(options: UseListBehaviorOptions): UseListBehaviorResult;
//# sourceMappingURL=useListBehavior.d.ts.map