import React from "react";
import type { StormContainerStyleProps } from "../../styles/styleProps.js";
export interface FormContextValue {
    values: Record<string, string>;
    setValue: (name: string, value: string) => void;
    errors: Map<string, string>;
    setError: (name: string, error: string | null) => void;
    activeField: string | null;
    setActiveField: (name: string | null) => void;
    submit: () => void;
}
export declare const FormContext: React.Context<FormContextValue | null>;
export declare function useFormContext(): FormContextValue;
export interface FormRootProps {
    onSubmit?: (values: Record<string, string>) => void;
    initialValues?: Record<string, string>;
    children: React.ReactNode;
}
declare function FormRoot({ onSubmit, initialValues, children }: FormRootProps): React.ReactElement;
export interface FormCompoundFieldProps {
    name: string;
    type?: "text" | "password" | "number" | "select" | "checkbox" | "radio" | "switch";
    label?: string;
    validate?: (value: string) => string | null;
    children?: React.ReactNode;
}
declare function FormCompoundField({ name, type, label, validate, children }: FormCompoundFieldProps): React.ReactElement;
export interface FormCompoundSubmitProps {
    label?: string;
    children?: React.ReactNode;
}
declare function FormCompoundSubmit({ label, children }: FormCompoundSubmitProps): React.ReactElement;
export interface FormFieldOption {
    label: string;
    value: string;
}
export interface FormField {
    key: string;
    label: string;
    type?: "text" | "password" | "number" | "select" | "checkbox" | "radio" | "switch";
    placeholder?: string;
    required?: boolean;
    validate?: (value: string) => string | null;
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    /** Options for select and radio field types. */
    options?: FormFieldOption[];
    /** On/Off labels for switch fields. */
    onLabel?: string;
    offLabel?: string;
    /** Async validation function called on blur (Tab away). Shows "validating..." while pending. */
    asyncValidate?: (value: string) => Promise<string | null>;
}
export interface FormProps extends StormContainerStyleProps {
    fields: FormField[];
    onSubmit?: (values: Record<string, string>) => void;
    isFocused?: boolean;
    submitLabel?: string;
    /** Initial values for pre-populating fields. */
    initialValues?: Record<string, string>;
    /** Callback fired when any individual field value changes. */
    onFieldChange?: (key: string, value: string) => void;
    /** Callback fired when form is reset (Escape key). */
    onReset?: () => void;
    /** Custom render for each form field row. */
    renderField?: (field: FormField, state: {
        value: string;
        error: string | null;
        isFocused: boolean;
    }) => React.ReactNode;
    "aria-label"?: string;
}
export declare const Form: React.NamedExoticComponent<FormProps> & {
    Root: typeof FormRoot;
    Field: typeof FormCompoundField;
    Submit: typeof FormCompoundSubmit;
};
export {};
//# sourceMappingURL=Form.d.ts.map