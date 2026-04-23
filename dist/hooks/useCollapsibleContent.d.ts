export interface UseCollapsibleContentOptions {
    content: string;
    maxLines?: number;
    toggleKey?: {
        key: string;
        ctrl?: boolean;
        shift?: boolean;
    };
    defaultExpanded?: boolean;
    isActive?: boolean;
}
export interface UseCollapsibleContentResult {
    displayText: string;
    expanded: boolean;
    hiddenLines: number;
    toggle: () => void;
    hint: string;
}
export declare function useCollapsibleContent(options: UseCollapsibleContentOptions): UseCollapsibleContentResult;
//# sourceMappingURL=useCollapsibleContent.d.ts.map