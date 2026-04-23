import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface SelectOption {
    label: string;
    value: string;
    /** Optional group name. Items with the same group render under a group header. */
    group?: string;
    /** Disabled items render dimmed and are skipped by keyboard navigation. */
    disabled?: boolean;
    /** Description rendered as dim text after the label. */
    description?: string;
}
export interface SelectProps extends StormLayoutStyleProps {
    options: Array<SelectOption>;
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Whether the select captures keyboard input (default true). */
    isFocused?: boolean;
    /** Max visible items in dropdown. Scrolls when options exceed this. */
    maxVisible?: number;
    "aria-label"?: string;
    /** Custom renderer for each option in the dropdown. */
    renderOption?: (item: SelectOption, state: {
        isActive: boolean;
        isSelected: boolean;
        isDisabled: boolean;
    }) => React.ReactNode;
}
export interface SelectContextValue {
    value: string | undefined;
    onChange: (value: string) => void;
    isOpen: boolean;
    setOpen: (open: boolean) => void;
    activeIndex: number;
    setActiveIndex: (index: number) => void;
    filter: string;
    setFilter: (filter: string) => void;
}
export declare const SelectContext: React.Context<SelectContextValue | null>;
export declare function useSelectContext(): SelectContextValue;
export interface SelectRootProps {
    value?: string;
    onChange?: (value: string) => void;
    children: React.ReactNode;
}
declare function SelectRoot({ value, onChange, children }: SelectRootProps): React.ReactElement;
export interface SelectTriggerProps {
    children?: React.ReactNode;
    placeholder?: string;
}
declare function SelectTrigger({ children, placeholder }: SelectTriggerProps): React.ReactElement;
export interface SelectContentProps {
    maxVisible?: number;
    children: React.ReactNode;
}
declare function SelectContent({ maxVisible, children }: SelectContentProps): React.ReactElement | null;
export interface SelectCompoundOptionProps {
    value: string;
    label?: string;
    disabled?: boolean;
    children?: React.ReactNode;
}
declare function SelectCompoundOption({ value: optionValue, label, disabled, children }: SelectCompoundOptionProps): React.ReactElement;
export declare const Select: React.NamedExoticComponent<SelectProps> & {
    Root: typeof SelectRoot;
    Trigger: typeof SelectTrigger;
    Content: typeof SelectContent;
    Option: typeof SelectCompoundOption;
};
export {};
//# sourceMappingURL=Select.d.ts.map