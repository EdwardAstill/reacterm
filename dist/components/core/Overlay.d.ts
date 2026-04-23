import React from "react";
import type { BorderStyle } from "../../core/types.js";
export interface OverlayProps {
    children?: React.ReactNode;
    visible?: boolean;
    position?: "center" | "bottom" | "top" | "center-left" | "center-right";
    width?: number | `${number}%`;
    height?: number;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    borderStyle?: BorderStyle;
    borderColor?: string | number;
    padding?: number;
    paddingX?: number;
    paddingY?: number;
}
export declare const Overlay: React.NamedExoticComponent<OverlayProps>;
//# sourceMappingURL=Overlay.d.ts.map