export type EventCalendarView = "month" | "week" | "day" | "agenda";
export interface EventCalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    color?: string | number;
    description?: string;
    location?: string;
}
export interface UseEventCalendarBehaviorOptions {
    events?: EventCalendarEvent[];
    anchorDate?: Date;
    defaultAnchorDate?: Date;
    onAnchorDateChange?: (date: Date) => void;
    view?: EventCalendarView;
    defaultView?: EventCalendarView;
    onViewChange?: (view: EventCalendarView) => void;
    weekStartsOn?: 0 | 1;
    agendaDays?: number;
    today?: Date;
}
export interface EventCalendarController {
    anchorDate: Date;
    view: EventCalendarView;
    weekStartsOn: 0 | 1;
    events: EventCalendarEvent[];
    visibleStart: Date;
    visibleEnd: Date;
    visibleDates: Date[];
    title: string;
    today: Date;
    next: () => void;
    prev: () => void;
    goToToday: () => void;
    setView: (view: EventCalendarView) => void;
    setAnchorDate: (date: Date) => void;
    getEventsForDay: (date: Date) => EventCalendarEvent[];
    getEventsForRange: (start: Date, end: Date) => EventCalendarEvent[];
}
export declare function useEventCalendarBehavior(options?: UseEventCalendarBehaviorOptions): EventCalendarController;
//# sourceMappingURL=useEventCalendarBehavior.d.ts.map