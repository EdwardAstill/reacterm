import React from "react";
export interface TooltipProps {
    content: string;
    children: React.ReactNode;
    visible?: boolean;
    position?: "top" | "bottom" | "right" | "left";
    color?: string | number;
    /** Maximum width for the tooltip text (truncates long content). */
    maxWidth?: number;
    /** Delay in milliseconds before showing the tooltip (default 0). */
    delay?: number;
    /** Show a small arrow character pointing from tooltip to target (default false). */
    arrow?: boolean;
    /** Row position of the target element — used for auto-flip when tooltip overflows. */
    targetRow?: number;
    /** Column position of the target element — used for auto-flip when tooltip overflows. */
    targetCol?: number;
    /** Custom render for the tooltip content. */
    renderContent?: (content: string) => React.ReactNode;
}
export declare const Tooltip: React.NamedExoticComponent<TooltipProps>;
//# sourceMappingURL=Tooltip.d.ts.map