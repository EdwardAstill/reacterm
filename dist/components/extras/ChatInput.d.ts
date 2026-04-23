import React from "react";
export interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit?: (value: string) => void;
    placeholder?: string;
    /** Max rows before scrolling (default 4) */
    maxRows?: number;
    /** Maximum characters allowed. Input is capped at this length. */
    maxLength?: number;
    width?: number | `${number}%`;
    flex?: number;
    /** @deprecated Use isFocused instead */
    focus?: boolean;
    /** Whether the input is focused. */
    isFocused?: boolean;
    color?: string | number;
    placeholderColor?: string | number;
    history?: string[];
    /** When true, Enter inserts newline; Ctrl+Enter/Cmd+Enter sends. When false, Enter sends (default). */
    multiline?: boolean;
    /** When true, input is non-interactive. */
    disabled?: boolean;
    /** Called when the text selection changes. */
    onSelectionChange?: (start: number, end: number) => void;
    /** Override prompt character (from personality.interaction.promptChar). */
    promptChar?: string;
    /** Override cursor style (from personality.interaction.cursorStyle). */
    cursorStyle?: "block" | "underline" | "bar";
    "aria-label"?: string;
}
export declare const ChatInput: React.NamedExoticComponent<ChatInputProps>;
//# sourceMappingURL=ChatInput.d.ts.map