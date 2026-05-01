import React from "react";
import type { useColors } from "../../hooks/useColors.js";
import type { usePersonality } from "../../core/personality.js";
import { type Block, type InlineToken, type ListNode } from "./parse.js";
export interface InlineRenderContext {
    colors: ReturnType<typeof useColors>;
    personality: ReturnType<typeof usePersonality>;
}
export declare function renderInlineTokens(tokens: InlineToken[], ctx: InlineRenderContext, keyPrefix: string): React.ReactNode[];
export declare function renderInlineText(text: string, ctx: InlineRenderContext, keyPrefix: string): React.ReactNode;
export declare function renderListItems(items: ListNode[], ctx: InlineRenderContext, depth: number, ordered: boolean, keyPrefix: string): React.ReactElement[];
export declare function renderTable(block: Extract<Block, {
    type: "table";
}>, ctx: InlineRenderContext, key: string): React.ReactElement;
export declare function renderBlock(block: Block, ctx: InlineRenderContext, key: string): React.ReactElement;
//# sourceMappingURL=render-blocks.d.ts.map