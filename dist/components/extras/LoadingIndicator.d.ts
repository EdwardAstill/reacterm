import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export type LoadingStyle = "spinner" | "dots" | "bar" | "pulse" | "gradient";
export type LoadingSize = "sm" | "md" | "lg";
export interface LoadingIndicatorProps extends StormLayoutStyleProps {
    /** Animation style. @default "spinner" */
    style?: LoadingStyle;
    /** Size of the animation area. @default "md" */
    size?: LoadingSize;
    /** Primary message shown below the animation. */
    message?: string;
    /** Dimmer subtitle shown below the message. */
    subtitle?: string;
    /** When provided (0-1), switches to determinate progress mode. */
    progress?: number;
    /** Override animation speed in ms. @default personality-based */
    interval?: number;
    /** Whether animation is active. @default true */
    active?: boolean;
    /** Custom gradient colors for "gradient" style. */
    gradientColors?: string[];
}
export declare const LoadingIndicator: React.NamedExoticComponent<LoadingIndicatorProps>;
//# sourceMappingURL=LoadingIndicator.d.ts.map