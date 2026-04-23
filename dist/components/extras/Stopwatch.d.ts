import React from "react";
export interface StopwatchProps {
    /** Whether the stopwatch is running (default: true) */
    running?: boolean;
    /** Called on each tick with elapsed milliseconds */
    onTick?: (elapsedMs: number) => void;
    /** Display format (default: "mm:ss") */
    format?: "mm:ss" | "hh:mm:ss" | "ss.ms";
    color?: string | number;
}
export declare const Stopwatch: React.NamedExoticComponent<StopwatchProps>;
//# sourceMappingURL=Stopwatch.d.ts.map