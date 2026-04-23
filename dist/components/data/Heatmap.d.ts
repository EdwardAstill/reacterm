import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface HeatmapProps extends StormLayoutStyleProps {
    /** 2D data: rows of values. data[row][col] */
    data: number[][];
    /** Row labels (left side) */
    rowLabels?: string[];
    /** Column labels (bottom) */
    colLabels?: string[];
    /** Color ramp: [low, high] hex colors. Default: dark surface to brand primary.
     *  @deprecated Use `colorStops` for multi-stop gradients. */
    colors?: [string, string];
    /** Multi-stop color gradient. Array of 2+ hex colors interpolated evenly.
     *  Takes precedence over `colors` prop when provided. */
    colorStops?: string[];
    /** Show numeric values inside cells */
    showValues?: boolean;
    /** Cell width in characters (default 3) */
    cellWidth?: number;
    title?: string;
    /** Override: must be numeric for layout width. */
    width?: number;
    /** Override: must be numeric for layout height. */
    height?: number;
    /** When true, enable interactive cell cursor navigation with arrow keys. */
    interactive?: boolean;
    /** Whether this chart is currently focused (required for interactive mode). */
    isFocused?: boolean;
    /** Custom renderer for the cursor tooltip. */
    renderTooltip?: (value: number, row: number, col: number) => React.ReactNode;
}
export declare const Heatmap: React.NamedExoticComponent<HeatmapProps>;
//# sourceMappingURL=Heatmap.d.ts.map