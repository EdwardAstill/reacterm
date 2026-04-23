import React from "react";
export interface CommandItem {
    name: string;
    description: string;
}
export interface CommandDropdownProps {
    /** Items to display. */
    items: readonly CommandItem[];
    /** Currently selected index (default: 0). */
    selectedIndex?: number;
    /** Maximum visible items before scrolling (default: 6). */
    maxVisible?: number;
    /** Highlight color for the selected item (default: brand primary). */
    highlightColor?: string;
    isFocused?: boolean;
    /** Called when the user selects an item with Enter. */
    onSelect?: (item: CommandItem) => void;
    /** Called when keyboard navigation changes the selected index. */
    onSelectionChange?: (index: number) => void;
    /** Called when the dropdown is closed (second Escape press). */
    onClose?: () => void;
    /** Override the selection indicator string (default: "▸ "). */
    selectionIndicator?: string;
    /** Custom render for each dropdown item. */
    renderItem?: (item: CommandItem, isSelected: boolean) => React.ReactNode;
}
export declare const CommandDropdown: React.NamedExoticComponent<CommandDropdownProps>;
//# sourceMappingURL=CommandDropdown.d.ts.map