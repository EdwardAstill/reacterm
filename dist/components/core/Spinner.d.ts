import React from "react";
import type { StormTextStyleProps } from "../../styles/styleProps.js";
export type SpinnerType = "dots" | "line" | "arc" | "bounce" | "braille" | "storm" | "flywheel" | "clock" | "arrows" | "pulse" | "wave" | "moon" | "diamond" | "storm-logo";
export interface SpinnerProps extends StormTextStyleProps {
    /** Spinner animation style.
     *  @default personality.animation.spinnerType */
    type?: SpinnerType;
    /** Frame interval in milliseconds.
     *  @default personality-based (durationNormal / 2.5, min 40, fallback 80) */
    interval?: number;
    label?: string;
    labelColor?: string | number;
    /** When provided (0-100), shows a determinate progress indicator instead of spinning. */
    progress?: number;
    /** Custom renderer for each animation frame. */
    renderFrame?: (frame: string, index: number) => React.ReactNode;
    /** Custom renderer for the label text. */
    renderLabel?: (label: string) => React.ReactNode;
}
export declare const Spinner: React.NamedExoticComponent<SpinnerProps>;
//# sourceMappingURL=Spinner.d.ts.map