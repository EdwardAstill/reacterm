import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export type SwitchSize = "sm" | "md" | "lg";
export interface SwitchProps extends StormLayoutStyleProps {
    checked: boolean;
    onChange?: (checked: boolean) => void;
    label?: string;
    onLabel?: string;
    offLabel?: string;
    isFocused?: boolean;
    disabled?: boolean;
    /** Track size: sm (3-char), md (5-char, default), lg (7-char) */
    size?: SwitchSize;
    /** Custom render for the switch track visual. */
    renderTrack?: (state: {
        checked: boolean;
        disabled: boolean;
    }) => React.ReactNode;
    "aria-label"?: string;
}
export declare const Switch: React.NamedExoticComponent<SwitchProps>;
//# sourceMappingURL=Switch.d.ts.map