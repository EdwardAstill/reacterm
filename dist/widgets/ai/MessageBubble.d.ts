import React from "react";
/** Built-in role mappings for auto-setting symbol and symbolColor. */
type MessageRole = "user" | "assistant" | "system" | "tool";
/** An action hint rendered below the message. */
export interface MessageAction {
    /** Display label for the action. */
    label: string;
    /** Key the user presses to trigger the action. */
    key: string;
    /** Callback invoked when the action key is pressed. */
    onAction: () => void;
}
export interface MessageBubbleProps {
    /** Role symbol displayed on the left. Overrides role default. */
    symbol?: string;
    /** Color for the symbol. Overrides role default. */
    symbolColor?: string;
    /** Message role — auto-sets symbol and symbolColor if not explicitly provided. */
    role?: MessageRole;
    /** Message content. */
    children: React.ReactNode;
    /** Optional metadata line (timing, token counts, etc). */
    meta?: string;
    /** Optional timestamp rendered dim on the right side. */
    timestamp?: string;
    /** When true and children is a string, render through MarkdownText. */
    markdown?: boolean;
    /** Action hints displayed below the message. */
    actions?: MessageAction[];
    /** Whether the bubble captures keyboard input for actions (default true). */
    isFocused?: boolean;
    /** Custom renderer for the role symbol. */
    renderSymbol?: (symbol: string, color: string) => React.ReactNode;
}
export declare const MessageBubble: React.NamedExoticComponent<MessageBubbleProps>;
export {};
//# sourceMappingURL=MessageBubble.d.ts.map