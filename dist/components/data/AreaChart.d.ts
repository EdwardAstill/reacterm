import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
import type { ChartSeries } from "./chart-types.js";
export interface AreaChartProps extends StormLayoutStyleProps {
    series: ChartSeries[];
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
    xLabels?: string[];
    /** Controls fill density: "full" fills every dot, "sparse" uses checkerboard. */
    fillDensity?: "full" | "sparse";
    /** When true, stack series on top of each other (cumulative Y values). */
    stacked?: boolean;
    /** Custom render for chart tooltip (shown alongside data). */
    renderTooltip?: (series: ChartSeries, index: number, value: number) => React.ReactNode;
}
export declare const AreaChart: React.NamedExoticComponent<AreaChartProps>;
//# sourceMappingURL=AreaChart.d.ts.map