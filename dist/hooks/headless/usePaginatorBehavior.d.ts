export interface UsePaginatorBehaviorOptions {
    total: number;
    current: number;
    onPageChange?: (page: number) => void;
    isActive?: boolean;
}
export interface UsePaginatorBehaviorResult {
    /** Current page index (0-based, clamped) */
    page: number;
    /** Total number of pages */
    totalPages: number;
    /** Go to previous page */
    prev: () => void;
    /** Go to next page */
    next: () => void;
    /** Go to a specific page (0-based) */
    goTo: (page: number) => void;
    /** Whether there is a previous page */
    hasPrev: boolean;
    /** Whether there is a next page */
    hasNext: boolean;
}
export declare function usePaginatorBehavior(options: UsePaginatorBehaviorOptions): UsePaginatorBehaviorResult;
//# sourceMappingURL=usePaginatorBehavior.d.ts.map