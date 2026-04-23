import type { StormColors } from "../theme/colors.js";
export declare function resample(data: number[], targetWidth: number): number[];
export declare function formatAxisLabel(value: number, width: number): string;
export declare function getSeriesPalette(colors: StormColors): readonly string[];
/**
 * Composite multiple rendered braille canvases into per-cell character and color arrays.
 * Later canvases (higher index) take color ownership when their dots are non-empty.
 * Returns { cellChars, cellColors } arrays of length `cols`.
 */
export declare function composeBrailleCells(renderedCanvases: readonly {
    lines: string[];
    color: string | number;
}[], cols: number, row: number): {
    cellChars: string[];
    cellColors: (string | number)[];
};
//# sourceMappingURL=chart-helpers.d.ts.map