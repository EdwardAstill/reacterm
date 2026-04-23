import React from "react";
import type { BarData, StackedBarData } from "./chart-types.js";
export interface BarChartProps {
    /** Simple bars: [{label, value, color?}] */
    bars?: BarData[];
    /** Stacked bars: [{label, segments: [{value, color?, name?}]}] */
    stacked?: StackedBarData[];
    /** Grouped bars: multiple series shown side by side */
    grouped?: {
        series: {
            name: string;
            data: number[];
            color?: string | number;
        }[];
        labels: string[];
    };
    orientation?: "vertical" | "horizontal";
    showValues?: boolean;
    width?: number;
    height?: number;
    color?: string | number;
    barGap?: number;
    /** Bar width in characters (horizontal) or columns (vertical) */
    barWidth?: number;
    title?: string;
    showAxes?: boolean;
    axisColor?: string | number;
    showLegend?: boolean;
    interactive?: boolean;
    /** Whether this chart is currently focused (required for interactive mode). */
    isFocused?: boolean;
    /** When true, animate bar height transitions when data changes (~200ms). */
    animated?: boolean;
    renderTooltip?: (bar: {
        label: string;
        value: number;
        color: string;
    }, index: number) => React.ReactNode;
}
export declare const BarChart: React.NamedExoticComponent<BarChartProps>;
//# sourceMappingURL=BarChart.d.ts.map