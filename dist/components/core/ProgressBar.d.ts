import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface ProgressBarProps extends StormLayoutStyleProps {
    /** Progress value 0-100. Pass undefined or -1 for indeterminate mode. */
    value: number | undefined;
    /** Override: must be numeric for bar width calculation. */
    width?: number;
    trackColor?: string | number;
    showPercent?: boolean;
    label?: string;
    /** Start timestamp (Date.now()). When provided, enables ETA display. */
    startTime?: number;
    /** When true (and startTime provided), show items/second or %/second rate. */
    showRate?: boolean;
    /** Custom renderer for the label/percentage display. */
    renderLabel?: (percent: number, label?: string) => React.ReactNode;
}
export declare const ProgressBar: React.NamedExoticComponent<ProgressBarProps>;
//# sourceMappingURL=ProgressBar.d.ts.map