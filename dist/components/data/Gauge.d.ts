import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface GaugeThreshold {
    /** The value at which this threshold color activates (0-100). */
    value: number;
    /** Color to use when the gauge value is at or above this threshold. */
    color: string | number;
}
export interface GaugeProps extends StormLayoutStyleProps {
    value: number;
    label?: string;
    color?: string | number;
    width?: number;
    /** Threshold-based color breakpoints. Sorted ascending by value. */
    thresholds?: GaugeThreshold[];
    /** When true, display the numeric percentage value next to the bar. */
    showValue?: boolean;
    /** Display variant: "bar" (default) for horizontal bar, "arc" for semi-circular gauge. */
    variant?: "bar" | "arc";
    /** Custom render for the value display. */
    renderValue?: (value: number, label?: string) => React.ReactNode;
}
export declare const Gauge: React.NamedExoticComponent<GaugeProps>;
//# sourceMappingURL=Gauge.d.ts.map