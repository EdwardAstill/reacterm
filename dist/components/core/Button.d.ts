import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
export interface ButtonProps extends StormLayoutStyleProps {
    label: string;
    onPress?: () => void;
    isFocused?: boolean;
    disabled?: boolean;
    loading?: boolean;
    /** Visual variant (default "primary") */
    variant?: ButtonVariant;
    /** Size: sm = [Label], md = [ Label ] (default), lg = [  Label  ] */
    size?: ButtonSize;
    /** Shortcut key label displayed next to the button label */
    shortcut?: string;
    /** Override the border style used around the button (from personality.borders.default). */
    borderStyle?: string;
    /** Override the focus indicator style (from personality.interaction.focusIndicator). */
    focusIndicator?: "border" | "highlight" | "arrow" | "bar";
    /** Custom render for the button label. */
    renderLabel?: (label: string, state: {
        isFocused: boolean;
        disabled: boolean;
        loading: boolean;
    }) => React.ReactNode;
    "aria-label"?: string;
}
export declare const Button: React.NamedExoticComponent<ButtonProps>;
//# sourceMappingURL=Button.d.ts.map