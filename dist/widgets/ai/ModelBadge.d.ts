import React from "react";
export interface ModelBadgeProps {
    model: string;
    provider?: string;
    capabilities?: string[];
    maxTokens?: number;
    color?: string | number;
    renderModel?: (model: string, provider?: string) => React.ReactNode;
    /** Merged with built-in PROVIDER_COLORS. */
    providerColors?: Record<string, string>;
}
export declare const ModelBadge: React.NamedExoticComponent<ModelBadgeProps>;
//# sourceMappingURL=ModelBadge.d.ts.map