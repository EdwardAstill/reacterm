import React from "react";
export interface CostTrackerProps {
    inputTokens: number;
    outputTokens: number;
    /** Default: 3. */
    inputCostPer1M?: number;
    /** Default: 15. */
    outputCostPer1M?: number;
    /** Default: "$". */
    currency?: string;
    sessionTotal?: number;
    compact?: boolean;
    renderCost?: (cost: number, currency: string) => React.ReactNode;
}
export declare const CostTracker: React.NamedExoticComponent<CostTrackerProps>;
//# sourceMappingURL=CostTracker.d.ts.map