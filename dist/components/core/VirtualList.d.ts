import React from "react";
export interface VirtualListContextValue {
    selectedIndex: number;
    setSelectedIndex: (index: number) => void;
    scrollTop: number;
    scrollTo: (index: number) => void;
}
export declare const VirtualListContext: React.Context<VirtualListContextValue | null>;
export declare function useVirtualListContext(): VirtualListContextValue;
export interface VirtualListRootProps {
    height: number;
    width?: number | string;
    selectedIndex?: number;
    onSelectedIndexChange?: (index: number) => void;
    children: React.ReactNode;
}
declare function VirtualListRoot({ height, width, selectedIndex, onSelectedIndexChange, children, }: VirtualListRootProps): React.ReactElement;
export interface VirtualListCompoundItemProps {
    index?: number;
    children: React.ReactNode;
}
declare function VirtualListCompoundItem({ index, children }: VirtualListCompoundItemProps): React.ReactElement;
export interface VirtualListProps<T> {
    items: readonly T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    itemHeight?: number;
    height: number;
    width?: number | string;
    keyExtractor?: (item: T, index: number) => string;
    onSelect?: (item: T, index: number) => void;
    isFocused?: boolean;
    selectedIndex?: number;
    emptyMessage?: string;
}
declare function VirtualListInner<T>(rawProps: VirtualListProps<T>): React.ReactElement;
export declare const VirtualList: typeof VirtualListInner & {
    Root: typeof VirtualListRoot;
    Item: typeof VirtualListCompoundItem;
};
export {};
//# sourceMappingURL=VirtualList.d.ts.map