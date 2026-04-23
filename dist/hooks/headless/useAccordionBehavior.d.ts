export interface AccordionBehaviorSection {
    key: string;
    title: string;
}
export interface UseAccordionBehaviorOptions {
    sections: AccordionBehaviorSection[];
    activeKeys?: string[];
    onToggle?: (key: string) => void;
    exclusive?: boolean;
    isActive?: boolean;
}
export interface UseAccordionBehaviorResult {
    /** Keys of currently open sections */
    openKeys: string[];
    /** Index of the currently focused section header */
    focusedIndex: number;
    /** Toggle a section by key */
    toggle: (key: string) => void;
    /** Get props for a section by its key */
    getSectionProps: (key: string) => {
        isOpen: boolean;
        isFocused: boolean;
        onToggle: () => void;
        role: string;
        index: number;
    };
}
export declare function useAccordionBehavior(options: UseAccordionBehaviorOptions): UseAccordionBehaviorResult;
//# sourceMappingURL=useAccordionBehavior.d.ts.map