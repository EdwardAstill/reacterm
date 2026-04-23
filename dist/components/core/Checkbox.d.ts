import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface CheckboxProps extends StormLayoutStyleProps {
    checked: boolean;
    onChange?: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
    /** Whether this checkbox captures keyboard input (default true). */
    isFocused?: boolean;
    /** When true, shows [-] indeterminate state instead of checked/unchecked. */
    indeterminate?: boolean;
    /** Description text rendered as dim text below the label. */
    description?: string;
    /** Custom render for the checkbox indicator. */
    renderIndicator?: (state: {
        checked: boolean;
        indeterminate: boolean;
        focused: boolean;
    }) => React.ReactNode;
    "aria-label"?: string;
}
export declare const Checkbox: React.NamedExoticComponent<CheckboxProps>;
//# sourceMappingURL=Checkbox.d.ts.map