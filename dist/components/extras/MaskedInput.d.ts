import React from "react";
export interface MaskedInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit?: (value: string) => void;
    mask: string;
    placeholder?: string;
    color?: string | number;
    /** @deprecated Use isFocused instead */
    focus?: boolean;
    /** Whether the input is focused. */
    isFocused?: boolean;
    disabled?: boolean;
    width?: number | `${number}%`;
    height?: number | `${number}%`;
    flex?: number;
    /** Custom render for the formatted display. */
    renderDisplay?: (formatted: string, cursor: number) => React.ReactNode;
    "aria-label"?: string;
}
export declare const MaskedInput: React.NamedExoticComponent<MaskedInputProps>;
//# sourceMappingURL=MaskedInput.d.ts.map