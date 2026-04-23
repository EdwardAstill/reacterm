import React from "react";
export type DotState = "pending" | "running" | "streaming" | "completed" | "failed" | "cancelled";
export interface BlinkDotProps {
    state: DotState;
    interval?: number;
    /** Character to display when the dot is visible (default "●") */
    dotCharacter?: string;
    /** Character to display when the dot is hidden during blink (default " ") */
    offCharacter?: string;
    /** Custom render for the dot */
    renderDot?: (char: string, state: DotState) => React.ReactNode;
}
export declare const BlinkDot: React.NamedExoticComponent<BlinkDotProps>;
//# sourceMappingURL=BlinkDot.d.ts.map