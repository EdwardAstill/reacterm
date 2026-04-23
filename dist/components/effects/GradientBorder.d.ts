import React from "react";
export interface GradientBorderProps {
    children: React.ReactNode;
    /** Gradient from/to colors (default violet to mint) */
    colors?: [string, string];
    /** Box width in characters (default 40) */
    width?: number | string;
    /** Inner padding in spaces (default 1) */
    padding?: number;
}
export declare const GradientBorder: React.NamedExoticComponent<GradientBorderProps>;
//# sourceMappingURL=GradientBorder.d.ts.map