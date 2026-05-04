import { useState } from "react";
import { MONTH_NAMES } from "../../utils/date.js";

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

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return startOfDay(next);
}

function addMonths(date: Date, months: number): Date {
  return startOfDay(new Date(date.getFullYear(), date.getMonth() + months, date.getDate()));
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfWeek(date: Date, weekStartsOn: 0 | 1): Date {
  const current = startOfDay(date);
  const weekday = current.getDay();
  const offset = weekStartsOn === 1 ? (weekday === 0 ? 6 : weekday - 1) : weekday;
  return addDays(current, -offset);
}

function endOfWeek(date: Date, weekStartsOn: 0 | 1): Date {
  return endOfDay(addDays(startOfWeek(date, weekStartsOn), 6));
}

function buildVisibleDates(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  let cursor = startOfDay(start);
  const endTime = startOfDay(end).getTime();
  while (cursor.getTime() <= endTime) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

function formatMonthTitle(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()] ?? ""} ${date.getFullYear()}`;
}

function formatShortDate(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]?.slice(0, 3) ?? ""} ${date.getDate()}, ${date.getFullYear()}`;
}

function getVisibleRange(
  anchorDate: Date,
  view: EventCalendarView,
  weekStartsOn: 0 | 1,
  agendaDays: number,
): { visibleStart: Date; visibleEnd: Date } {
  if (view === "week") {
    return {
      visibleStart: startOfWeek(anchorDate, weekStartsOn),
      visibleEnd: endOfWeek(anchorDate, weekStartsOn),
    };
  }

  if (view === "day") {
    return {
      visibleStart: startOfDay(anchorDate),
      visibleEnd: endOfDay(anchorDate),
    };
  }

  if (view === "agenda") {
    const visibleStart = startOfDay(anchorDate);
    return {
      visibleStart,
      visibleEnd: endOfDay(addDays(visibleStart, Math.max(1, agendaDays) - 1)),
    };
  }

  const monthStart = startOfMonth(anchorDate);
  const monthEnd = endOfMonth(anchorDate);
  return {
    visibleStart: startOfWeek(monthStart, weekStartsOn),
    visibleEnd: endOfWeek(monthEnd, weekStartsOn),
  };
}

function getTitle(
  anchorDate: Date,
  view: EventCalendarView,
  weekStartsOn: 0 | 1,
  agendaDays: number,
): string {
  if (view === "month") {
    return formatMonthTitle(anchorDate);
  }

  if (view === "day") {
    return formatShortDate(anchorDate);
  }

  if (view === "week") {
    const start = startOfWeek(anchorDate, weekStartsOn);
    const end = addDays(start, 6);
    return `${formatShortDate(start)} - ${formatShortDate(end)}`;
  }

  const start = startOfDay(anchorDate);
  const end = addDays(start, Math.max(1, agendaDays) - 1);
  return `Agenda: ${formatShortDate(start)} - ${formatShortDate(end)}`;
}

function sortEvents(events: EventCalendarEvent[]): EventCalendarEvent[] {
  return [...events].sort((a, b) => {
    if (Boolean(a.allDay) !== Boolean(b.allDay)) {
      return a.allDay ? -1 : 1;
    }
    return a.start.getTime() - b.start.getTime();
  });
}

function overlapsDay(event: EventCalendarEvent, date: Date): boolean {
  const dayStart = startOfDay(date).getTime();
  const dayEnd = endOfDay(date).getTime();
  return event.start.getTime() <= dayEnd && event.end.getTime() >= dayStart;
}

export function useEventCalendarBehavior(
  options: UseEventCalendarBehaviorOptions = {},
): EventCalendarController {
  const {
    events = [],
    anchorDate: controlledAnchorDate,
    defaultAnchorDate,
    onAnchorDateChange,
    view: controlledView,
    defaultView = "month",
    onViewChange,
    weekStartsOn = 0,
    agendaDays = 14,
    today: todayProp,
  } = options;

  const [uncontrolledAnchorDate, setUncontrolledAnchorDate] = useState<Date>(
    startOfDay(defaultAnchorDate ?? controlledAnchorDate ?? todayProp ?? new Date()),
  );
  const [uncontrolledView, setUncontrolledView] = useState<EventCalendarView>(
    controlledView ?? defaultView,
  );

  const anchorDate = startOfDay(controlledAnchorDate ?? uncontrolledAnchorDate);
  const view = controlledView ?? uncontrolledView;
  const today = startOfDay(todayProp ?? new Date());
  const normalizedEvents = sortEvents(events);
  const { visibleStart, visibleEnd } = getVisibleRange(anchorDate, view, weekStartsOn, agendaDays);
  const visibleDates = buildVisibleDates(visibleStart, visibleEnd);

  const setAnchorDate = (date: Date): void => {
    const normalized = startOfDay(date);
    if (controlledAnchorDate === undefined) {
      setUncontrolledAnchorDate(normalized);
    }
    onAnchorDateChange?.(normalized);
  };

  const setView = (nextView: EventCalendarView): void => {
    if (controlledView === undefined) {
      setUncontrolledView(nextView);
    }
    onViewChange?.(nextView);
  };

  const shiftAnchor = (direction: -1 | 1): void => {
    if (view === "month") {
      setAnchorDate(addMonths(anchorDate, direction));
      return;
    }
    if (view === "week") {
      setAnchorDate(addDays(anchorDate, direction * 7));
      return;
    }
    if (view === "agenda") {
      setAnchorDate(addDays(anchorDate, direction * Math.max(1, agendaDays)));
      return;
    }
    setAnchorDate(addDays(anchorDate, direction));
  };

  const getEventsForRange = (start: Date, end: Date): EventCalendarEvent[] => {
    const startTime = startOfDay(start).getTime();
    const endTime = endOfDay(end).getTime();
    return normalizedEvents.filter((event) =>
      event.start.getTime() <= endTime && event.end.getTime() >= startTime,
    );
  };

  const getEventsForDay = (date: Date): EventCalendarEvent[] =>
    normalizedEvents.filter((event) => overlapsDay(event, date));

  return {
    anchorDate,
    view,
    weekStartsOn,
    events: normalizedEvents,
    visibleStart,
    visibleEnd,
    visibleDates,
    title: getTitle(anchorDate, view, weekStartsOn, agendaDays),
    today,
    next: () => shiftAnchor(1),
    prev: () => shiftAnchor(-1),
    goToToday: () => setAnchorDate(today),
    setView,
    setAnchorDate,
    getEventsForDay,
    getEventsForRange,
  };
}
