import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
import { type EventCalendarController, type EventCalendarEvent, type EventCalendarView } from "../../hooks/headless/useEventCalendarBehavior.js";
export interface EventCalendarProps extends StormLayoutStyleProps {
    events: EventCalendarEvent[];
    controller?: EventCalendarController;
    anchorDate?: Date;
    defaultAnchorDate?: Date;
    onAnchorDateChange?: (date: Date) => void;
    view?: EventCalendarView;
    defaultView?: EventCalendarView;
    onViewChange?: (view: EventCalendarView) => void;
    weekStartsOn?: 0 | 1;
    agendaDays?: number;
    maxVisibleEventsPerDay?: number;
    selectedEventId?: string;
    defaultSelectedEventId?: string;
    onSelectEvent?: (event: EventCalendarEvent) => void;
    isFocused?: boolean;
    "aria-label"?: string;
}
export interface EventCalendarViewRendererProps {
    controller: EventCalendarController;
    maxVisibleEventsPerDay?: number;
    selectedEventId?: string | undefined;
    onSelectEvent: (event: EventCalendarEvent) => void;
}
declare function EventCalendarMonthView({ controller, maxVisibleEventsPerDay, selectedEventId, onSelectEvent, }: EventCalendarViewRendererProps): React.ReactElement;
declare function EventCalendarWeekView({ controller, selectedEventId, onSelectEvent, }: EventCalendarViewRendererProps): React.ReactElement;
declare function EventCalendarDayView({ controller, selectedEventId, onSelectEvent, }: EventCalendarViewRendererProps): React.ReactElement;
declare function EventCalendarAgendaView({ controller, selectedEventId, onSelectEvent, }: EventCalendarViewRendererProps): React.ReactElement;
interface EventCalendarComponentType extends React.NamedExoticComponent<EventCalendarProps> {
    Month: typeof EventCalendarMonthView;
    Week: typeof EventCalendarWeekView;
    Day: typeof EventCalendarDayView;
    Agenda: typeof EventCalendarAgendaView;
}
export declare const EventCalendar: EventCalendarComponentType;
export {};
//# sourceMappingURL=EventCalendar.d.ts.map