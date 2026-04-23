import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface SparklineProps extends StormLayoutStyleProps {
    data: readonly number[];
    /** Override: must be numeric for sparkline width calculation. */
    width?: number;
    /** Override: must be numeric for sparkline height calculation. */
    height?: number;
    min?: number;
    max?: number;
    /** Color for empty space in multi-row mode. */
    fillColor?: string | number;
    /** Label rendered centered below the sparkline. */
    label?: string;
    /** Per-bar conditional color function. Return undefined to fall back to `color` prop. */
    colorFn?: (value: number, index: number, data: readonly number[]) => string | number | undefined;
    /** When true, highlight min bar in error color and max bar in success color. */
    showMinMax?: boolean;
    /** Rendering mode: "bar" (block characters) or "line" (braille connected line). */
    mode?: "bar" | "line";
    /** Custom renderer for the label. */
    renderLabel?: (label: string, data: number[]) => React.ReactNode;
}
export declare const Sparkline: React.NamedExoticComponent<SparklineProps>;
//# sourceMappingURL=Sparkline.d.ts.map