import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface ScatterPlotSeries {
    data: [number, number][];
    name?: string;
    color?: string | number;
}
export interface ScatterPlotProps extends StormLayoutStyleProps {
    series: ScatterPlotSeries[];
    /** Override: must be numeric for chart cell column calculation. */
    width?: number;
    /** Override: must be numeric for chart cell row calculation. */
    height?: number;
    xMin?: number;
    xMax?: number;
    yMin?: number;
    yMax?: number;
    showAxes?: boolean;
    showLegend?: boolean;
    axisColor?: string | number;
    title?: string;
    /** Dot size: 1 = single dot, 2 = 2x2 cluster. */
    dotSize?: 1 | 2;
    /** When true, compute and display a linear regression trend line. */
    showTrend?: boolean;
    /** When true, enable interactive mode. */
    interactive?: boolean;
    /** Whether this chart is currently focused (required for interactive/zoomable mode). */
    isFocused?: boolean;
    /** When true, enable zoom (+/-) and pan (arrow keys). Requires interactive+isFocused. */
    zoomable?: boolean;
    /** Custom renderer for a tooltip (not yet connected to cursor — placeholder for future interactive hover). */
    renderTooltip?: (point: [number, number], seriesIndex: number) => React.ReactNode;
}
export declare const ScatterPlot: React.NamedExoticComponent<ScatterPlotProps>;
//# sourceMappingURL=ScatterPlot.d.ts.map