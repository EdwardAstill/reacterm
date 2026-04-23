import React from "react";
export interface TimerProps {
    /** Start time (Date.now() or ms timestamp). If set, shows elapsed. */
    startTime?: number;
    /** Target duration in ms. If set with startTime, shows countdown. */
    duration?: number;
    /** Manual value override (formatted string like "01:23") */
    value?: string;
    /** Update interval in ms (default: 1000) */
    interval?: number;
    color?: string | number;
    /** Show when running (default: true) */
    running?: boolean;
    prefix?: string;
}
export declare const Timer: React.NamedExoticComponent<TimerProps>;
//# sourceMappingURL=Timer.d.ts.map