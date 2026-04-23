import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface LineChartSeries {
    data: number[];
    color?: string | number;
    name?: string;
}
export interface LineChartProps extends StormLayoutStyleProps {
    series: LineChartSeries[];
    /** Override: must be numeric for chart cell column calculation. */
    width?: number;
    /** Override: must be numeric for chart cell row calculation. */
    height?: number;
    yMin?: number;
    yMax?: number;
    showAxes?: boolean;
    showLegend?: boolean;
    axisColor?: string | number;
    title?: string;
    /** Labels to display along the X-axis. Spaced evenly across the chart width. */
    xLabels?: string[];
    /** When true, draw faint horizontal dotted grid lines at Y-axis tick positions. */
    showGrid?: boolean;
    /** When true, render a 3x3 braille dot cluster at each actual data point. */
    showPoints?: boolean;
    /** When true, enable interactive crosshair navigation with arrow keys. */
    interactive?: boolean;
    /** Whether this chart is currently focused (required for interactive mode). */
    isFocused?: boolean;
    /** When true, enable zoom with +/- keys around the crosshair position. Requires interactive+isFocused. */
    zoomable?: boolean;
    /** Custom renderer for the crosshair tooltip. */
    renderTooltip?: (seriesValues: Array<{
        name: string;
        value: number;
        color: string;
    }>, xIndex: number) => React.ReactNode;
}
export declare const LineChart: React.NamedExoticComponent<LineChartProps>;
//# sourceMappingURL=LineChart.d.ts.map