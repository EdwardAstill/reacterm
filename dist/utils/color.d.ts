import React from "react";
export declare function interpolateColor(color1: string, color2: string, t: number): string;
/**
 * Run-length encode consecutive same-color characters into tui-text elements.
 *
 * Given parallel arrays of characters and colors, batches consecutive runs
 * of the same color into single tui-text elements for efficient rendering.
 */
export declare function batchColorRuns(chars: string[], colors: (string | number)[], keyPrefix?: string): React.ReactElement[];
/**
 * Interpolate across multiple color stops evenly spaced from 0 to 1.
 */
export declare function getColorAt(stops: string[], position: number): string;
//# sourceMappingURL=color.d.ts.map