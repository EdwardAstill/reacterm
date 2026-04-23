export interface UseBatchActionOptions {
    itemCount: number;
    isActive?: boolean;
}
export interface UseBatchActionResult {
    selected: ReadonlySet<number>;
    isSelecting: boolean;
    toggle: (index: number) => void;
    selectAll: () => void;
    deselectAll: () => void;
    /** Execute an action on all selected items, then clear selection */
    execute: (action: (indices: number[]) => void) => void;
    count: number;
}
export declare function useBatchAction(options: UseBatchActionOptions): UseBatchActionResult;
//# sourceMappingURL=useBatchAction.d.ts.map