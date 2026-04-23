import React from "react";
import type { StormTextStyleProps } from "../../styles/styleProps.js";
export interface GlowTextProps extends StormTextStyleProps {
    children: string;
    /** Glow intensity (default "medium") */
    intensity?: "low" | "medium" | "high";
    /** When true, the glow pulses between intensity levels at a configurable interval. */
    animate?: boolean;
    /** Pulse animation interval in ms (default 400). */
    animateInterval?: number;
}
export declare const GlowText: React.NamedExoticComponent<GlowTextProps>;
//# sourceMappingURL=GlowText.d.ts.map