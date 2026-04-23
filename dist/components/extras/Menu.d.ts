import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface MenuItem {
    label: string;
    value: string;
    shortcut?: string;
    disabled?: boolean;
    separator?: boolean;
    /** Optional icon rendered before the label. */
    icon?: string;
    /** Submenu items. Right arrow opens, Left arrow / Escape closes. */
    children?: MenuItem[];
}
export interface MenuProps extends StormLayoutStyleProps {
    items: MenuItem[];
    onSelect?: (value: string) => void;
    isFocused?: boolean;
    activeColor?: string | number;
    /** Max visible items. Scrolls when items exceed this. */
    maxVisible?: number;
    "aria-label"?: string;
    /** Custom renderer for each menu item. */
    renderItem?: (item: MenuItem, state: {
        isActive: boolean;
        isDisabled: boolean;
        hasSubmenu: boolean;
    }) => React.ReactNode;
}
export interface MenuContextValue {
    activeIndex: number;
    setActiveIndex: (index: number) => void;
    onSelect: ((value: string) => void) | undefined;
}
export declare const MenuContext: React.Context<MenuContextValue | null>;
export declare function useMenuContext(): MenuContextValue;
export interface MenuRootProps {
    onSelect?: (value: string) => void;
    children: React.ReactNode;
}
declare function MenuRoot({ onSelect, children }: MenuRootProps): React.ReactElement;
export interface MenuCompoundItemProps {
    value: string;
    label?: string;
    disabled?: boolean;
    icon?: string;
    shortcut?: string;
    children?: React.ReactNode;
}
declare function MenuCompoundItem({ value, label, disabled, icon, shortcut, children }: MenuCompoundItemProps): React.ReactElement;
export interface MenuSeparatorProps {
    children?: React.ReactNode;
}
declare function MenuSeparator({ children }: MenuSeparatorProps): React.ReactElement;
export interface MenuSubmenuProps {
    label: string;
    icon?: string;
    children: React.ReactNode;
}
declare function MenuSubmenu({ label, icon, children }: MenuSubmenuProps): React.ReactElement;
export declare const Menu: React.NamedExoticComponent<MenuProps> & {
    Root: typeof MenuRoot;
    Item: typeof MenuCompoundItem;
    Separator: typeof MenuSeparator;
    Submenu: typeof MenuSubmenu;
};
export {};
//# sourceMappingURL=Menu.d.ts.map