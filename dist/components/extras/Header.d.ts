import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface HeaderProps extends Omit<StormLayoutStyleProps, "left" | "right"> {
    title: string;
    subtitle?: string;
    borderStyle?: "single" | "double" | "none";
    /** Override: must be numeric for border line repeat. */
    width?: number;
    /** Right-aligned content in the title row. */
    right?: string | React.ReactNode;
    /** Whether to show border lines (default true). */
    showBorder?: boolean;
    /** Custom render for the title area. */
    renderTitle?: (title: string, subtitle?: string) => React.ReactNode;
}
export declare const Header: React.NamedExoticComponent<HeaderProps>;
//# sourceMappingURL=Header.d.ts.map