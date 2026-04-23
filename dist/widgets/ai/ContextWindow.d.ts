import React from "react";
export interface ContextWindowProps {
    used: number;
    limit: number;
    breakdown?: Array<{
        label: string;
        tokens: number;
        color?: string;
    }>;
    compact?: boolean;
    /** Default: 24. */
    barWidth?: number;
    history?: number[];
    renderBar?: (used: number, limit: number) => React.ReactNode;
    /** Default: block elements ▁▂▃▄▅▆▇█. */
    sparklineChars?: string[];
}
export declare const ContextWindow: React.NamedExoticComponent<ContextWindowProps>;
//# sourceMappingURL=ContextWindow.d.ts.map