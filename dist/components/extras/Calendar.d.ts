import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface CalendarProps extends StormLayoutStyleProps {
    year: number;
    month: number;
    selectedDay?: number;
    onSelect?: (day: number) => void;
    onMonthChange?: (year: number, month: number) => void;
    selectedColor?: string | number;
    /** Override today's date for highlighting. Auto-detected if omitted. */
    today?: Date;
    isFocused?: boolean;
    /** Start of date range to highlight. */
    rangeStart?: Date;
    /** End of date range to highlight. */
    rangeEnd?: Date;
    /** Predicate that returns true for dates that should be disabled (dimmed, unselectable). */
    disabledDates?: (date: Date) => boolean;
    /** Day the week starts on: 0 = Sunday (default), 1 = Monday. */
    weekStartsOn?: 0 | 1;
    /** Custom render for each day cell. */
    renderDay?: (day: number, state: {
        isSelected: boolean;
        isToday: boolean;
        isDisabled: boolean;
        isInRange: boolean;
    }) => React.ReactNode;
    "aria-label"?: string;
}
export interface CalendarContextValue {
    year: number;
    month: number;
    selectedDay: number | undefined;
    focusedDay: number | undefined;
    selectDay: (day: number) => void;
    changeMonth: (year: number, month: number) => void;
}
export declare const CalendarContext: React.Context<CalendarContextValue | null>;
export declare function useCalendarContext(): CalendarContextValue;
export interface CalendarRootProps {
    year: number;
    month: number;
    selectedDay?: number;
    focusedDay?: number;
    onSelect?: (day: number) => void;
    onMonthChange?: (year: number, month: number) => void;
    children: React.ReactNode;
}
declare function CalendarRoot({ year, month, selectedDay, focusedDay, onSelect, onMonthChange, children }: CalendarRootProps): React.ReactElement;
declare function CalendarCompoundHeader(): React.ReactElement;
export interface CalendarCompoundGridProps {
    weekStartsOn?: 0 | 1;
    children?: React.ReactNode;
}
declare function CalendarCompoundGrid({ weekStartsOn, children }: CalendarCompoundGridProps): React.ReactElement;
export interface CalendarCompoundDayProps {
    day: number;
    children?: React.ReactNode;
}
declare function CalendarCompoundDay({ day, children }: CalendarCompoundDayProps): React.ReactElement;
export declare const Calendar: React.NamedExoticComponent<CalendarProps> & {
    Root: typeof CalendarRoot;
    Header: typeof CalendarCompoundHeader;
    Grid: typeof CalendarCompoundGrid;
    Day: typeof CalendarCompoundDay;
};
export {};
//# sourceMappingURL=Calendar.d.ts.map