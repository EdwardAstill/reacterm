export interface FormBehaviorFieldOption {
    label: string;
    value: string;
}
export interface FormBehaviorField {
    key: string;
    label: string;
    type?: "text" | "password" | "number" | "select" | "checkbox" | "radio" | "switch";
    placeholder?: string;
    required?: boolean;
    validate?: (value: string) => string | null;
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    options?: FormBehaviorFieldOption[];
    /** On/Off labels for switch fields. */
    onLabel?: string;
    offLabel?: string;
    asyncValidate?: (value: string) => Promise<string | null>;
}
export interface UseFormBehaviorOptions {
    fields: FormBehaviorField[];
    onSubmit?: ((values: Record<string, string>) => void) | undefined;
    isActive?: boolean | undefined;
    initialValues?: Record<string, string> | undefined;
    onFieldChange?: ((key: string, value: string) => void) | undefined;
    onReset?: (() => void) | undefined;
}
export interface FormFieldState {
    value: string;
    error: string | undefined;
    isFocused: boolean;
    cursorPosition: number;
    isAsyncPending: boolean;
    isSelectOpen: boolean;
    selectHighlightIndex: number;
    isDirty: boolean;
}
export interface UseFormBehaviorResult {
    /** Current field values */
    values: Record<string, string>;
    /** Current validation errors (field key -> error message) */
    errors: ReadonlyMap<string, string>;
    /** Whether all fields pass validation */
    isValid: boolean;
    /** Index of the currently focused field (fields.length = submit button) */
    focusedIndex: number;
    /** Whether the submit button is focused */
    isSubmitFocused: boolean;
    /** Whether any field has been modified from its initial value */
    isDirty: boolean;
    /** Get props for a specific field */
    getFieldProps: (key: string) => FormFieldState;
    /** Submit the form */
    submit: () => boolean;
    /** Reset the form to initial values */
    reset: () => void;
    /** Undo the last text edit for a specific field (returns true if undo was performed) */
    undo: (key: string) => boolean;
}
export declare function useFormBehavior(options: UseFormBehaviorOptions): UseFormBehaviorResult;
//# sourceMappingURL=useFormBehavior.d.ts.map