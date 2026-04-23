import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface OptionListItem {
    /** Display text for the option. */
    label: string;
    /** Value passed to onSelect when chosen. */
    value: string;
    /** If true, the item cannot be selected or navigated to. */
    disabled?: boolean;
    /** If true, renders a divider line instead of a selectable option. */
    separator?: boolean;
    /** Rich content: React node rendered in place of the plain label. */
    richLabel?: React.ReactNode;
}
export interface OptionListProps extends StormLayoutStyleProps {
    items: OptionListItem[];
    /** Fired when the user presses Enter on an active option. */
    onSelect?: (value: string) => void;
    /** Fired when the highlighted/active item changes. */
    onChange?: (value: string) => void;
    /** Whether this component receives keyboard input. */
    isFocused?: boolean;
    /** Color for the active/highlighted item. */
    activeColor?: string | number;
    /** Maximum visible items before scrolling kicks in. */
    maxVisible?: number;
    /** Override the selection indicator character. */
    indicator?: string;
    /** Show line numbers / index for each option. */
    showIndex?: boolean;
    "aria-label"?: string;
    /** Custom renderer for each option item. */
    renderItem?: (item: OptionListItem, state: {
        isActive: boolean;
        isDisabled: boolean;
        index: number;
    }) => React.ReactNode;
}
export interface OptionListContextValue {
    activeIndex: number;
    setActiveIndex: (index: number) => void;
    onSelect: ((value: string) => void) | undefined;
}
export declare const OptionListContext: React.Context<OptionListContextValue | null>;
export declare function useOptionListContext(): OptionListContextValue;
export interface OptionListRootProps {
    onSelect?: (value: string) => void;
    children: React.ReactNode;
}
declare function OptionListRoot({ onSelect, children }: OptionListRootProps): React.ReactElement;
export interface OptionListCompoundItemProps {
    value: string;
    label?: string;
    disabled?: boolean;
    children?: React.ReactNode;
}
declare function OptionListCompoundItem({ value, label, disabled, children, }: OptionListCompoundItemProps): React.ReactElement;
export interface OptionListSeparatorProps {
    children?: React.ReactNode;
}
declare function OptionListSeparator({ children }: OptionListSeparatorProps): React.ReactElement;
export declare const OptionList: React.NamedExoticComponent<OptionListProps> & {
    Root: typeof OptionListRoot;
    Item: typeof OptionListCompoundItem;
    Separator: typeof OptionListSeparator;
};
export {};
//# sourceMappingURL=OptionList.d.ts.map