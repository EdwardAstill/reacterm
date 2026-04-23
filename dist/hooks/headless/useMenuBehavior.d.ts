export interface MenuBehaviorItem {
    label: string;
    value: string;
    shortcut?: string;
    disabled?: boolean;
    separator?: boolean;
    icon?: string;
    children?: MenuBehaviorItem[];
}
export interface UseMenuBehaviorOptions {
    items: MenuBehaviorItem[];
    onSelect?: (value: string) => void;
    isActive?: boolean;
    maxVisible?: number;
}
export interface SubmenuFrame {
    items: MenuBehaviorItem[];
    activeIndex: number;
}
export interface UseMenuBehaviorResult {
    /** Index of the active/highlighted item in the current menu level */
    activeIndex: number;
    /** Stack of parent menus when navigating into submenus */
    submenuStack: readonly SubmenuFrame[];
    /** Current depth (0 = root menu) */
    depth: number;
    /** The items at the current menu level */
    currentItems: MenuBehaviorItem[];
    /** Visible items after maxVisible windowing */
    visibleItems: MenuBehaviorItem[];
    /** Offset of visible window */
    visibleOffset: number;
    /** Breadcrumb trail of parent menu labels */
    breadcrumbs: string[];
    /** Get props for a menu item by its index in the visible list */
    getItemProps: (visibleIndex: number) => {
        isActive: boolean;
        isDisabled: boolean;
        isSeparator: boolean;
        hasSubmenu: boolean;
        item: MenuBehaviorItem;
        globalIndex: number;
    };
    /** Props for the menu container */
    menuProps: {
        role: string;
    };
}
export declare function useMenuBehavior(options: UseMenuBehaviorOptions): UseMenuBehaviorResult;
//# sourceMappingURL=useMenuBehavior.d.ts.map