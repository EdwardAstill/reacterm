import React from "react";
import type { StormContainerStyleProps } from "../../styles/styleProps.js";
export interface ListViewItem {
    key: string;
    label: string;
    description?: string;
    icon?: string;
}
export interface ListViewProps extends StormContainerStyleProps {
    items: readonly ListViewItem[];
    selectedKey?: string;
    onSelect?: (key: string) => void;
    onHighlight?: (key: string) => void;
    maxVisible?: number;
    highlightColor?: string | number;
    isFocused?: boolean;
    emptyMessage?: string;
    /** Custom item renderer. Receives item, whether highlighted, and the index. */
    renderItem?: (item: ListViewItem, isHighlighted: boolean, index: number) => React.ReactElement;
}
export interface ListViewContextValue {
    highlightIndex: number;
    setHighlightIndex: (index: number) => void;
    filterText: string;
    setFilterText: (text: string) => void;
    onSelect: ((key: string) => void) | undefined;
}
export declare const ListViewContext: React.Context<ListViewContextValue | null>;
export declare function useListViewContext(): ListViewContextValue;
export interface ListViewRootProps {
    highlightIndex?: number;
    onHighlightChange?: (index: number) => void;
    filterText?: string;
    onFilterChange?: (text: string) => void;
    onSelect?: (key: string) => void;
    children: React.ReactNode;
}
declare function ListViewRoot({ highlightIndex, onHighlightChange, filterText, onFilterChange, onSelect, children, }: ListViewRootProps): React.ReactElement;
export interface ListViewCompoundItemProps {
    item: ListViewItem;
    index?: number;
    children?: React.ReactNode;
}
declare function ListViewCompoundItem({ item, index, children }: ListViewCompoundItemProps): React.ReactElement;
export declare const ListView: React.NamedExoticComponent<ListViewProps> & {
    Root: typeof ListViewRoot;
    Item: typeof ListViewCompoundItem;
};
export {};
//# sourceMappingURL=ListView.d.ts.map