export interface UseSearchFilterOptions<T> {
    items: T[];
    getLabel: (item: T) => string;
    debounceMs?: number;
    isActive?: boolean;
}
export interface UseSearchFilterResult<T> {
    query: string;
    setQuery: (q: string) => void;
    filtered: T[];
    matchCount: number;
    clear: () => void;
}
export declare function useSearchFilter<T>(options: UseSearchFilterOptions<T>): UseSearchFilterResult<T>;
//# sourceMappingURL=useSearchFilter.d.ts.map