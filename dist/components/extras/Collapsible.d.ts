import React from "react";
import type { StormContainerStyleProps } from "../../styles/styleProps.js";
export interface CollapsibleProps extends StormContainerStyleProps {
    title: string;
    expanded?: boolean;
    onToggle?: (expanded: boolean) => void;
    children?: React.ReactNode;
    /** When true, briefly dims content as a visual hint during collapse transitions. */
    animated?: boolean;
    /** Override the hint text shown when collapsed (from personality.interaction.collapseHint). */
    collapseHint?: string;
    /** Custom renderer for the collapsible header. */
    renderHeader?: (props: {
        expanded: boolean;
        title: string;
    }) => React.ReactNode;
}
export interface CollapsibleContextValue {
    expanded: boolean;
    toggle: () => void;
}
export declare const CollapsibleContext: React.Context<CollapsibleContextValue | null>;
export declare function useCollapsibleContext(): CollapsibleContextValue;
export interface CollapsibleRootProps {
    expanded?: boolean;
    onToggle?: (expanded: boolean) => void;
    children: React.ReactNode;
}
declare function CollapsibleRoot({ expanded: expandedProp, onToggle, children }: CollapsibleRootProps): React.ReactElement;
export interface CollapsibleCompoundHeaderProps {
    children?: React.ReactNode;
    title?: string;
}
declare function CollapsibleCompoundHeader({ children, title }: CollapsibleCompoundHeaderProps): React.ReactElement;
export interface CollapsibleCompoundContentProps {
    children: React.ReactNode;
}
declare function CollapsibleCompoundContent({ children }: CollapsibleCompoundContentProps): React.ReactElement | null;
export declare const Collapsible: React.NamedExoticComponent<CollapsibleProps> & {
    Root: typeof CollapsibleRoot;
    Header: typeof CollapsibleCompoundHeader;
    Content: typeof CollapsibleCompoundContent;
};
export {};
//# sourceMappingURL=Collapsible.d.ts.map