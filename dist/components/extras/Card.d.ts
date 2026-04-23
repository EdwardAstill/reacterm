import React from "react";
import type { StormContainerStyleProps } from "../../styles/styleProps.js";
export interface CardProps extends StormContainerStyleProps {
    children: React.ReactNode;
    title?: string;
    icon?: string;
    variant?: "default" | "storm" | "success" | "error" | "warning";
    focused?: boolean;
    "aria-label"?: string;
    /** Footer content rendered at the bottom with a dim divider line above it. */
    footer?: string | React.ReactNode;
    /** Right-aligned content in the title row. */
    headerRight?: string | React.ReactNode;
    /** When true, show shimmer placeholder instead of children. */
    loading?: boolean;
    /** Custom render for the card title area. */
    renderTitle?: (title: string, icon?: string) => React.ReactNode;
}
export interface CardContextValue {
    variant: "default" | "storm" | "success" | "error" | "warning";
    focused: boolean;
}
export declare const CardContext: React.Context<CardContextValue | null>;
export declare function useCardContext(): CardContextValue;
export interface CardRootProps {
    variant?: "default" | "storm" | "success" | "error" | "warning";
    focused?: boolean;
    children: React.ReactNode;
    "aria-label"?: string;
}
declare function CardRoot({ variant, focused, children, ...rest }: CardRootProps): React.ReactElement;
export interface CardCompoundHeaderProps {
    children: React.ReactNode;
}
declare function CardCompoundHeader({ children }: CardCompoundHeaderProps): React.ReactElement;
export interface CardCompoundBodyProps {
    children: React.ReactNode;
}
declare function CardCompoundBody({ children }: CardCompoundBodyProps): React.ReactElement;
export interface CardCompoundFooterProps {
    children: React.ReactNode;
}
declare function CardCompoundFooter({ children }: CardCompoundFooterProps): React.ReactElement;
export declare const Card: React.NamedExoticComponent<CardProps> & {
    Root: typeof CardRoot;
    Header: typeof CardCompoundHeader;
    Body: typeof CardCompoundBody;
    Footer: typeof CardCompoundFooter;
};
export {};
//# sourceMappingURL=Card.d.ts.map