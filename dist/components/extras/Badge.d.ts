import React from "react";
import type { StormTextStyleProps } from "../../styles/styleProps.js";
export interface BadgeProps extends StormTextStyleProps {
    label: string;
    variant?: "default" | "success" | "warning" | "error" | "info" | "outline";
    /** Display mode: label (text), dot (colored dot only), count (number with max). */
    mode?: "label" | "dot" | "count";
    /** The count value displayed in "count" mode. */
    count?: number;
    /** Maximum count before showing "N+" (default 99). Only used in "count" mode. */
    max?: number;
    /** Custom render for the badge content. */
    renderContent?: (label: string, variant: string, mode: string) => React.ReactNode;
}
export declare const Badge: React.NamedExoticComponent<BadgeProps>;
//# sourceMappingURL=Badge.d.ts.map