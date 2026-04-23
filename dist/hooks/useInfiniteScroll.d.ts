export interface UseInfiniteScrollOptions {
    onLoadMore: () => Promise<void>;
    hasMore: boolean;
    threshold?: number;
    isActive?: boolean;
}
export interface UseInfiniteScrollResult {
    isLoading: boolean;
    onScroll: (position: number, total: number) => void;
}
export declare function useInfiniteScroll(options: UseInfiniteScrollOptions): UseInfiniteScrollResult;
//# sourceMappingURL=useInfiniteScroll.d.ts.map