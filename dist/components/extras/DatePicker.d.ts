import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface DatePickerProps extends StormLayoutStyleProps {
    /** Currently selected date. */
    value?: Date;
    /** Called when the user selects a date. */
    onChange?: (date: Date) => void;
    /** Display format string. Supports YYYY, YY, MMMM, MMM, MM, DD tokens. Default: "YYYY-MM-DD". */
    format?: string;
    /** Text shown when no date is selected. */
    placeholder?: string;
    /** Earliest selectable date. */
    minDate?: Date;
    /** Latest selectable date. */
    maxDate?: Date;
    /** Whether the picker is disabled (dimmed, no input). */
    disabled?: boolean;
    /** Whether the picker captures keyboard input (default true). */
    isFocused?: boolean;
    /** Controlled open state. Omit for uncontrolled. */
    isOpen?: boolean;
    /** Called when the dropdown open state changes. */
    onOpenChange?: (open: boolean) => void;
    /** Day the week starts on: 0 = Sunday (default), 1 = Monday. */
    weekStartsOn?: 0 | 1;
    /** Override today's date for highlighting. Auto-detected if omitted. */
    today?: Date;
    "aria-label"?: string;
}
export interface DatePickerContextValue {
    value: Date | undefined;
    viewYear: number;
    viewMonth: number;
    isOpen: boolean;
    disabled: boolean;
    format: string;
    placeholder: string;
    selectDate: (date: Date) => void;
    setOpen: (open: boolean) => void;
    changeMonth: (year: number, month: number) => void;
}
export declare const DatePickerContext: React.Context<DatePickerContextValue | null>;
export declare function useDatePickerContext(): DatePickerContextValue;
export interface DatePickerRootProps {
    value?: Date;
    onChange?: (date: Date) => void;
    format?: string;
    placeholder?: string;
    disabled?: boolean;
    children: React.ReactNode;
}
declare function DatePickerRoot({ value, onChange, format, placeholder, disabled, children }: DatePickerRootProps): React.ReactElement;
declare function DatePickerCompoundTrigger(): React.ReactElement;
declare function DatePickerCompoundCalendar(): React.ReactElement | null;
export declare const DatePicker: React.NamedExoticComponent<DatePickerProps> & {
    Root: typeof DatePickerRoot;
    Trigger: typeof DatePickerCompoundTrigger;
    Calendar: typeof DatePickerCompoundCalendar;
};
export {};
//# sourceMappingURL=DatePicker.d.ts.map