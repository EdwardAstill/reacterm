export interface UseSortableOptions {
    columns: string[];
    defaultSort?: {
        key: string;
        direction: "asc" | "desc";
    };
    isActive?: boolean;
    onSort?: (key: string, direction: "asc" | "desc") => void;
}
export interface UseSortableResult {
    sortKey: string | null;
    sortDirection: "asc" | "desc";
    toggleSort: (key: string) => void;
    setSort: (key: string, direction: "asc" | "desc") => void;
    clearSort: () => void;
    /** Returns sort indicator string for a column: "▲", "▼", or "" */
    indicator: (key: string) => string;
}
export declare function useSortable(options: UseSortableOptions): UseSortableResult;
//# sourceMappingURL=useSortable.d.ts.map