import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface RadioOption {
    value: string;
    label: string;
    /** Description text rendered as dim text below the label. */
    description?: string;
    /** When true, option is dimmed and skipped by navigation. */
    disabled?: boolean;
}
export interface RadioGroupProps extends StormLayoutStyleProps {
    options: readonly RadioOption[];
    value: string;
    onChange?: (value: string) => void;
    direction?: "column" | "row";
    isFocused?: boolean;
    /** Custom render for each radio option. */
    renderOption?: (option: RadioOption, state: {
        isSelected: boolean;
        isHighlighted: boolean;
        isDisabled: boolean;
    }) => React.ReactNode;
    "aria-label"?: string;
}
export interface RadioGroupContextValue {
    value: string;
    highlightIndex: number;
    select: (value: string) => void;
    setHighlightIndex: (index: number) => void;
}
export declare const RadioGroupContext: React.Context<RadioGroupContextValue | null>;
export declare function useRadioGroupContext(): RadioGroupContextValue;
export interface RadioGroupRootProps {
    value: string;
    onChange?: (value: string) => void;
    highlightIndex?: number;
    onHighlightChange?: (index: number) => void;
    children: React.ReactNode;
}
declare function RadioGroupRoot({ value, onChange, highlightIndex, onHighlightChange, children, }: RadioGroupRootProps): React.ReactElement;
export interface RadioGroupCompoundOptionProps {
    option: RadioOption;
    index?: number;
    children?: React.ReactNode;
}
declare function RadioGroupCompoundOption({ option, index, children }: RadioGroupCompoundOptionProps): React.ReactElement;
export declare const RadioGroup: React.NamedExoticComponent<RadioGroupProps> & {
    Root: typeof RadioGroupRoot;
    Option: typeof RadioGroupCompoundOption;
};
export {};
//# sourceMappingURL=RadioGroup.d.ts.map