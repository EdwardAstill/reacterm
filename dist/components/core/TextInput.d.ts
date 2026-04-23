import React from "react";
export interface TextInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit?: (value: string) => void;
    placeholder?: string;
    /** @deprecated Use isFocused instead */
    focus?: boolean;
    /** Whether the input is focused. */
    isFocused?: boolean;
    /** Alias for `focus`. When both are provided, `focus` takes precedence. */
    autoFocus?: boolean;
    color?: string | number;
    placeholderColor?: string | number;
    history?: string[];
    /** Maximum characters allowed. Input is capped at this length. */
    maxLength?: number;
    /** When true, input is non-interactive. */
    disabled?: boolean;
    /** Called when the text selection changes. */
    onSelectionChange?: (start: number, end: number) => void;
    width?: number | `${number}%`;
    height?: number;
    flex?: number;
    /** CSS-like class name(s) for StyleSheet matching (space-separated). */
    className?: string;
    /** CSS-like ID for StyleSheet matching (without the '#' prefix). */
    id?: string;
    "aria-label"?: string;
}
export declare const TextInput: React.NamedExoticComponent<TextInputProps>;
//# sourceMappingURL=TextInput.d.ts.map