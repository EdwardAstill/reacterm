import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface GradientProgressProps extends StormLayoutStyleProps {
    value: number;
    width?: number;
    /** Multi-stop gradient colors. Array of 2+ hex colors interpolated evenly.
     *  Takes precedence over fromColor/toColor. */
    colors?: string[];
    /** @deprecated Use `colors` array instead. Start color for 2-stop gradient. */
    fromColor?: string;
    /** @deprecated Use `colors` array instead. End color for 2-stop gradient. */
    toColor?: string;
    showPercentage?: boolean;
    label?: string;
    /** Custom render for the label and value display. */
    renderLabel?: (value: number, label?: string) => React.ReactNode;
}
export declare const GradientProgress: React.NamedExoticComponent<GradientProgressProps>;
//# sourceMappingURL=GradientProgress.d.ts.map