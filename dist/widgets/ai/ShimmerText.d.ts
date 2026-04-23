import React from "react";
export interface ShimmerTextProps {
    text: string;
    baseColor?: string;
    shimmerColor?: string;
    interval?: number;
    bold?: boolean;
    /** When false, stop the animation and show static text (default true). */
    active?: boolean;
    /** Width of the shimmer highlight window (default 3) */
    shimmerWidth?: number;
    /** Custom render for each text segment */
    renderSegment?: (text: string, isShimmer: boolean) => React.ReactNode;
}
export declare const ShimmerText: React.NamedExoticComponent<ShimmerTextProps>;
//# sourceMappingURL=ShimmerText.d.ts.map