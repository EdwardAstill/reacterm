export interface UseCalendarBehaviorOptions {
    year: number;
    month: number;
    selectedDay?: number;
    onSelect?: (day: number) => void;
    onMonthChange?: (year: number, month: number) => void;
    isActive?: boolean;
    rangeStart?: Date;
    rangeEnd?: Date;
    disabledDates?: (date: Date) => boolean;
    weekStartsOn?: 0 | 1;
}
export interface CalendarDayInfo {
    day: number;
    isSelected: boolean;
    isToday: boolean;
    isDisabled: boolean;
    isInRange: boolean;
    isCurrentMonth: boolean;
    dayOfWeek: number;
}
export interface UseCalendarBehaviorResult {
    /** Currently selected day (clamped to valid range) */
    selectedDate: number | undefined;
    /** The focused date (same as selectedDate in this model) */
    focusedDate: number | undefined;
    /** Range start date (if range selection is active) */
    rangeStart: Date | undefined;
    /** Range end date (if range selection is active) */
    rangeEnd: Date | undefined;
    /** Current year */
    year: number;
    /** Current month (1-12) */
    month: number;
    /** Number of days in the current month */
    daysInMonth: number;
    /** Day of week of the first day (adjusted for weekStartsOn) */
    firstDayOfWeek: number;
    /** Navigate to previous month */
    prevMonth: () => void;
    /** Navigate to next month */
    nextMonth: () => void;
    /** Get props for a specific day */
    getDayProps: (day: number) => CalendarDayInfo;
}
export declare function useCalendarBehavior(options: UseCalendarBehaviorOptions): UseCalendarBehaviorResult;
//# sourceMappingURL=useCalendarBehavior.d.ts.map