export interface UseMultiSelectOptions {
    itemCount: number;
    isActive?: boolean;
    onChange?: (selected: Set<number>) => void;
}
export interface UseMultiSelectResult {
    selected: ReadonlySet<number>;
    cursor: number;
    toggle: (index: number) => void;
    selectRange: (from: number, to: number) => void;
    selectAll: () => void;
    deselectAll: () => void;
    isSelected: (index: number) => boolean;
}
export declare function useMultiSelect(options: UseMultiSelectOptions): UseMultiSelectResult;
//# sourceMappingURL=useMultiSelect.d.ts.map