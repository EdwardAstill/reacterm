import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface BreadcrumbProps extends StormLayoutStyleProps {
    items: string[];
    separator?: string;
    activeColor?: string | number;
    /** Callback when a breadcrumb item is navigated to (by index in original items array). */
    onNavigate?: (index: number) => void;
    /** When true, enable keyboard navigation with Left/Right and Enter. */
    isFocused?: boolean;
    /** Maximum number of visible items. Middle items collapse to "...". */
    maxItems?: number;
    /** Number of items to show at the start when collapsing (default 1). */
    itemsBefore?: number;
    /** Number of items to show at the end when collapsing (default 1). */
    itemsAfter?: number;
    /** Custom renderer for each breadcrumb item. */
    renderItem?: (item: string, state: {
        isLast: boolean;
        index: number;
    }) => React.ReactNode;
}
export interface BreadcrumbContextValue {
    separator: string;
    activeColor: string | number;
    onNavigate: ((index: number) => void) | undefined;
    itemCount: number;
    registerItem: () => number;
}
export declare const BreadcrumbContext: React.Context<BreadcrumbContextValue | null>;
export declare function useBreadcrumbContext(): BreadcrumbContextValue;
export interface BreadcrumbRootProps {
    separator?: string;
    activeColor?: string | number;
    onNavigate?: (index: number) => void;
    children: React.ReactNode;
}
declare function BreadcrumbRoot({ separator, activeColor: activeColorProp, onNavigate, children }: BreadcrumbRootProps): React.ReactElement;
export interface BreadcrumbCompoundItemProps {
    children: React.ReactNode;
    isLast?: boolean;
}
declare function BreadcrumbCompoundItem({ children, isLast }: BreadcrumbCompoundItemProps): React.ReactElement;
export interface BreadcrumbSeparatorProps {
    children?: React.ReactNode;
}
declare function BreadcrumbSeparator({ children }: BreadcrumbSeparatorProps): React.ReactElement;
export declare const Breadcrumb: React.NamedExoticComponent<BreadcrumbProps> & {
    Root: typeof BreadcrumbRoot;
    Item: typeof BreadcrumbCompoundItem;
    Separator: typeof BreadcrumbSeparator;
};
export {};
//# sourceMappingURL=Breadcrumb.d.ts.map