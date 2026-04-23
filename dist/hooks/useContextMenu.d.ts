export interface ContextMenuItem {
    label: string;
    key: string;
    action: () => void;
    disabled?: boolean;
}
export interface UseContextMenuOptions {
    items: ContextMenuItem[];
    triggerKey?: {
        key: string;
        ctrl?: boolean;
        shift?: boolean;
    };
    isActive?: boolean;
}
export interface UseContextMenuResult {
    isOpen: boolean;
    activeIndex: number;
    open: () => void;
    close: () => void;
    items: ContextMenuItem[];
}
export declare function useContextMenu(options: UseContextMenuOptions): UseContextMenuResult;
//# sourceMappingURL=useContextMenu.d.ts.map