export interface SelectBehaviorOption {
    label: string;
    value: string;
    group?: string;
    disabled?: boolean;
    description?: string;
}
export interface UseSelectBehaviorOptions {
    options: SelectBehaviorOption[];
    value?: string;
    onChange?: (value: string) => void;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    isActive?: boolean;
    maxVisible?: number;
}
export interface UseSelectBehaviorResult {
    /** Whether the dropdown is currently open */
    isOpen: boolean;
    /** Index of the active/highlighted item in the filtered list */
    activeIndex: number;
    /** Current filter text from type-ahead */
    filterText: string;
    /** Filtered options based on current filter text */
    filteredItems: SelectBehaviorOption[];
    /** Visible items after maxVisible windowing */
    visibleItems: SelectBehaviorOption[];
    /** Offset of visible window start relative to filteredItems */
    visibleOffset: number;
    /** Open the dropdown */
    open: () => void;
    /** Close the dropdown */
    close: () => void;
    /** Props to spread on the trigger element */
    triggerProps: {
        onSelect: () => void;
    };
    /** Props for the list container */
    listProps: {
        role: string;
    };
    /** Get props for each option by its index in the visible list */
    getOptionProps: (visibleIndex: number) => {
        isActive: boolean;
        isSelected: boolean;
        isDisabled: boolean;
        option: SelectBehaviorOption;
        globalIndex: number;
    };
}
export declare function useSelectBehavior(options: UseSelectBehaviorOptions): UseSelectBehaviorResult;
//# sourceMappingURL=useSelectBehavior.d.ts.map