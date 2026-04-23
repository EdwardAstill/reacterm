import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface FooterBinding {
    key: string;
    label: string;
}
export interface FooterProps extends Omit<StormLayoutStyleProps, "left" | "right"> {
    children?: React.ReactNode;
    borderStyle?: "single" | "double" | "none";
    /** Override: must be numeric for border line repeat. */
    width?: number;
    /** Key bindings rendered as a KeyboardHelp-style bar. */
    bindings?: FooterBinding[];
    /** Left-aligned custom content. */
    left?: string | React.ReactNode;
    /** Right-aligned custom content. */
    right?: string | React.ReactNode;
    /** Custom render for footer content. */
    renderContent?: (children: React.ReactNode) => React.ReactNode;
}
export declare const Footer: React.NamedExoticComponent<FooterProps>;
//# sourceMappingURL=Footer.d.ts.map