import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface HistogramProps extends StormLayoutStyleProps {
    /** Raw data values to bin */
    data: number[];
    /** Number of bins (default: auto-computed as sqrt(n), clamped to 3..50) */
    bins?: number;
    /** Bar color */
    color?: string | number;
    /** Show bin count above each bar */
    showCounts?: boolean;
    title?: string;
    /** Override: must be numeric for chart width. */
    width?: number;
    /** Override: must be numeric for chart height (rows for bars). */
    height?: number;
    axisColor?: string | number;
    /** When true, render a vertical line at the mean value. */
    showMean?: boolean;
    /** When true, render a vertical line at the median value. */
    showMedian?: boolean;
    /** When true, show cumulative distribution (each bin = sum of all bins up to and including it). */
    cumulative?: boolean;
    /** Custom render for each histogram bar. */
    renderBar?: (bin: {
        min: number;
        max: number;
        count: number;
    }, index: number) => React.ReactNode;
}
export declare const Histogram: React.NamedExoticComponent<HistogramProps>;
//# sourceMappingURL=Histogram.d.ts.map