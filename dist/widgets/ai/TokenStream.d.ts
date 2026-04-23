import React from "react";
export interface TokenStreamProps {
    /** Total tokens so far. */
    tokens: number;
    /** Input/prompt tokens. */
    inputTokens?: number;
    /** Output/completion tokens. */
    outputTokens?: number;
    /** Current speed in tokens per second. */
    tokensPerSecond?: number;
    /** Context window limit. */
    maxTokens?: number;
    /** Model name. */
    model?: string;
    streaming?: boolean;
    /** Override color. */
    color?: string | number;
    /** Custom render for a metric (label + value pair). */
    renderMetric?: (label: string, value: string | number) => React.ReactNode;
}
export declare const TokenStream: React.NamedExoticComponent<TokenStreamProps>;
//# sourceMappingURL=TokenStream.d.ts.map