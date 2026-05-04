import React, { useCallback, useState } from "react";
import { useInput } from "../../hooks/useInput.js";
import { useMouseTarget } from "../../hooks/useMouseTarget.js";
import { useColors } from "../../hooks/useColors.js";
import { usePersonality } from "../../core/personality.js";
import type { KeyEvent } from "../../input/types.js";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { pickLayoutProps } from "../../styles/applyStyles.js";
import {
  useEventCalendarBehavior,
  type EventCalendarController,
  type EventCalendarEvent,
  type EventCalendarView,
} from "../../hooks/headless/useEventCalendarBehavior.js";

const DAY_NAMES_SUN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES_MON = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function formatDayLabel(date: Date): string {
  return `${DAY_NAMES_SUN[date.getDay()] ?? ""} ${date.getDate()}`;
}

function formatShortMonthDay(date: Date): string {
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${month} ${date.getDate()}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatEventTime(event: EventCalendarEvent): string {
  if (event.allDay) return "All day";
  return `${formatTime(event.start)}-${formatTime(event.end)}`;
}

function formatCompactEventTime(event: EventCalendarEvent): string {
  if (event.allDay) return "All day";
  return formatTime(event.start);
}

function truncate(text: string, max = 14): string {
  return text.length <= max ? text : `${text.slice(0, Math.max(1, max - 1))}…`;
}

function splitWeeks(dates: Date[]): Date[][] {
  const weeks: Date[][] = [];
  for (let index = 0; index < dates.length; index += 7) {
    weeks.push(dates.slice(index, index + 7));
  }
  return weeks;
}

const MONTH_CELL_BASE_HEIGHT = 3;
const WEEK_COLUMN_HEIGHT = 7;
const WEEK_EVENT_LABEL_WIDTH = 13;
const WEEK_VISIBLE_EVENTS = 2;
const EVENT_CALENDAR_BORDER_HEIGHT = 2;
const EVENT_CALENDAR_VIEW_SWITCHER_HEIGHT = 1;
const WEEK_HEADER_HEIGHT = 2;
const WEEK_CALENDAR_MIN_HEIGHT = EVENT_CALENDAR_BORDER_HEIGHT
  + WEEK_HEADER_HEIGHT
  + EVENT_CALENDAR_VIEW_SWITCHER_HEIGHT
  + WEEK_COLUMN_HEIGHT;
const AGENDA_CARD_MIN_HEIGHT = 4;

interface EventCalendarControlProps {
  label: string;
  active?: boolean;
  onPress: () => void;
}

function EventCalendarControl({ label, active = false, onPress }: EventCalendarControlProps): React.ReactElement {
  const colors = useColors();
  const mouseTarget = useMouseTarget({
    onMouse: (event) => {
      if (event.action !== "press" || event.button !== "left") return;
      onPress();
    },
  });

  return React.createElement(
    "tui-box",
    {
      role: "button",
      flexDirection: "row",
      ...mouseTarget.targetProps,
    },
    React.createElement(
      "tui-text",
      active
        ? { color: colors.brand.primary, bold: true, inverse: true }
        : { color: colors.text.secondary },
      active ? ` ${label} ` : `[${label}]`,
    ),
  );
}

interface EventSummaryRowProps {
  event: EventCalendarEvent;
  selected: boolean;
  label: string;
  onPress: () => void;
}

function EventSummaryRow({ event, selected, label, onPress }: EventSummaryRowProps): React.ReactElement {
  const colors = useColors();
  const mouseTarget = useMouseTarget({
    onMouse: (mouseEvent) => {
      if (mouseEvent.action !== "press" || mouseEvent.button !== "left") return;
      onPress();
    },
  });

  return React.createElement(
    "tui-box",
    {
      role: "button",
      "aria-label": `Select event ${event.title}`,
      testId: `event-calendar-event-${event.id}`,
      flexDirection: "row",
      ...mouseTarget.targetProps,
    },
    React.createElement(
      "tui-text",
      selected
        ? { color: colors.brand.primary, bold: true, inverse: true, wrap: "truncate" }
        : { color: event.color ?? colors.text.secondary, wrap: "truncate" },
      label,
    ),
  );
}

interface EventBlockProps {
  event: EventCalendarEvent;
  selected: boolean;
  onPress: () => void;
}

function EventBlock({ event, selected, onPress }: EventBlockProps): React.ReactElement {
  const colors = useColors();
  const mouseTarget = useMouseTarget({
    onMouse: (mouseEvent) => {
      if (mouseEvent.action !== "press" || mouseEvent.button !== "left") return;
      onPress();
    },
  });

  return React.createElement(
    "tui-box",
    {
      role: "button",
      "aria-label": `Select event ${event.title}`,
      testId: `event-calendar-event-${event.id}`,
      flexDirection: "column",
      borderStyle: "round",
      borderColor: selected ? colors.brand.primary : event.color ?? colors.brand.primary,
      paddingX: 1,
      ...mouseTarget.targetProps,
    },
    React.createElement(
      "tui-text",
      selected
        ? { bold: true, color: colors.brand.primary, inverse: true }
        : { bold: true, color: event.color ?? colors.brand.primary },
      event.title,
    ),
    React.createElement("tui-text", { color: colors.text.dim }, formatEventTime(event)),
    event.location
      ? React.createElement("tui-text", { color: colors.text.secondary }, truncate(event.location, 22))
      : null,
  );
}

interface EventCalendarWeekDayColumnProps {
  date: Date;
  events: EventCalendarEvent[];
  isToday: boolean;
  selectedEventId?: string | undefined;
  onSelectEvent: (event: EventCalendarEvent) => void;
}

function EventCalendarWeekDayColumn({
  date,
  events,
  isToday,
  selectedEventId,
  onSelectEvent,
}: EventCalendarWeekDayColumnProps): React.ReactElement {
  const colors = useColors();
  const visibleEvents = events.slice(0, WEEK_VISIBLE_EVENTS);
  const overflow = Math.max(0, events.length - visibleEvents.length);

  return React.createElement(
    "tui-box",
    {
      flex: 1,
      height: WEEK_COLUMN_HEIGHT,
      flexDirection: "column",
      borderStyle: "round",
      borderColor: isToday ? colors.brand.primary : colors.divider,
      paddingX: 1,
    },
    React.createElement(
      "tui-text",
      isToday
        ? { color: colors.brand.primary, bold: true, wrap: "truncate" }
        : { color: colors.text.primary, bold: true, wrap: "truncate" },
      formatDayLabel(date),
    ),
    ...visibleEvents.map((event) => React.createElement(
      "tui-box",
      {
        key: event.id,
        flexDirection: "column",
      },
      React.createElement(EventSummaryRow, {
        event,
        selected: selectedEventId === event.id,
        onPress: () => onSelectEvent(event),
        label: truncate(event.title, WEEK_EVENT_LABEL_WIDTH),
      }),
      React.createElement(
        "tui-text",
        {
          color: colors.text.dim,
          wrap: "truncate",
        },
        formatCompactEventTime(event),
      ),
    )),
    overflow > 0
      ? React.createElement("tui-text", { color: colors.text.dim, wrap: "truncate" }, `+${overflow} more`)
      : null,
    events.length === 0
      ? React.createElement("tui-text", { color: colors.text.dim }, "No events")
      : null,
  );
}

function EventCalendarMonthView({
  controller,
  maxVisibleEventsPerDay = 1,
  selectedEventId,
  onSelectEvent,
}: EventCalendarViewRendererProps): React.ReactElement {
  const colors = useColors();
  const weeks = splitWeeks(controller.visibleDates);
  const dayNames = controller.weekStartsOn === 1 ? DAY_NAMES_MON : DAY_NAMES_SUN;
  const visibleEventLimit = Math.max(1, maxVisibleEventsPerDay);
  const cellHeight = MONTH_CELL_BASE_HEIGHT + visibleEventLimit;

  return React.createElement(
    "tui-box",
    { flexDirection: "column" },
    React.createElement(
      "tui-box",
      { flexDirection: "row" },
      ...dayNames.map((name) => React.createElement(
        "tui-box",
        { key: name, flex: 1, paddingX: 1 },
        React.createElement("tui-text", { bold: true, color: colors.text.secondary }, name),
      )),
    ),
    React.createElement(
      "tui-box",
      { flexDirection: "column", gap: 1 },
      ...weeks.map((week, weekIndex) => React.createElement(
        "tui-box",
        { key: `week-${weekIndex}`, flexDirection: "row", gap: 1 },
        ...week.map((date) => {
          const events = controller.getEventsForDay(date);
          const isCurrentMonth = date.getMonth() === controller.anchorDate.getMonth();
          const isToday = isSameDay(date, controller.today);
          const visibleEvents = events.slice(0, visibleEventLimit);
          const overflow = Math.max(0, events.length - visibleEvents.length);
          return React.createElement(
            "tui-box",
            {
              key: date.toISOString(),
              flex: 1,
              height: cellHeight,
              flexDirection: "column",
              borderStyle: "round",
              borderColor: isToday ? colors.brand.primary : colors.divider,
              paddingX: 1,
            },
            React.createElement(
              "tui-text",
              isToday
                ? { color: colors.brand.primary, bold: true }
                : isCurrentMonth
                  ? { color: colors.text.primary, bold: true }
                  : { color: colors.text.dim },
              isCurrentMonth ? String(date.getDate()) : formatShortMonthDay(date),
            ),
            ...visibleEvents.map((event, eventIndex) => {
              const overflowLabel = overflow > 0 && eventIndex === visibleEvents.length - 1 ? `+${overflow} ` : "";
              return React.createElement(EventSummaryRow, {
                key: event.id,
                event,
                selected: selectedEventId === event.id,
                onPress: () => onSelectEvent(event),
                label: `${event.allDay ? "■" : "▣"} ${overflowLabel}${truncate(event.title, Math.max(6, 12 - overflowLabel.length))}`,
              });
            }),
            events.length === 0
              ? React.createElement("tui-text", { color: colors.text.dim }, " ")
              : null,
          );
        }),
      )),
    ),
  );
}

function EventCalendarWeekView({
  controller,
  selectedEventId,
  onSelectEvent,
}: EventCalendarViewRendererProps): React.ReactElement {
  return React.createElement(
    "tui-box",
    { flexDirection: "row", gap: 1, height: WEEK_COLUMN_HEIGHT },
    ...controller.visibleDates.map((date) => {
      const events = controller.getEventsForDay(date);
      const isToday = isSameDay(date, controller.today);
      return React.createElement(EventCalendarWeekDayColumn, {
        key: date.toISOString(),
        date,
        events,
        isToday,
        selectedEventId,
        onSelectEvent,
      });
    }),
  );
}

function EventCalendarDayView({
  controller,
  selectedEventId,
  onSelectEvent,
}: EventCalendarViewRendererProps): React.ReactElement {
  const colors = useColors();
  const events = controller.getEventsForDay(controller.anchorDate);
  const allDayEvents = events.filter((event) => event.allDay);
  const timedEvents = events.filter((event) => !event.allDay);

  return React.createElement(
    "tui-box",
    { flexDirection: "column", gap: 1 },
    React.createElement("tui-text", { bold: true, color: colors.text.primary }, formatDayLabel(controller.anchorDate)),
    allDayEvents.length > 0
      ? React.createElement(
        "tui-box",
        { flexDirection: "column", gap: 1 },
        React.createElement("tui-text", { color: colors.text.secondary, bold: true }, "All day"),
        ...allDayEvents.map((event) => React.createElement(EventBlock, {
          key: event.id,
          event,
          selected: selectedEventId === event.id,
          onPress: () => onSelectEvent(event),
        })),
      )
      : null,
    React.createElement("tui-text", { color: colors.text.secondary, bold: true }, "Timeline"),
    ...timedEvents.map((event) => React.createElement(EventBlock, {
      key: event.id,
      event,
      selected: selectedEventId === event.id,
      onPress: () => onSelectEvent(event),
    })),
    events.length === 0
      ? React.createElement("tui-text", { color: colors.text.dim }, "No events scheduled.")
      : null,
  );
}

function EventCalendarAgendaView({
  controller,
  selectedEventId,
  onSelectEvent,
}: EventCalendarViewRendererProps): React.ReactElement {
  const colors = useColors();
  return React.createElement(
    "tui-box",
    { flexDirection: "column", gap: 1 },
    ...controller.visibleDates.map((date) => {
      const events = controller.getEventsForDay(date);
      return React.createElement(
        "tui-box",
        {
          key: date.toISOString(),
          flexDirection: "column",
          minHeight: AGENDA_CARD_MIN_HEIGHT,
          borderStyle: "round",
          borderColor: colors.divider,
          paddingX: 1,
        },
        React.createElement("tui-text", { bold: true, color: colors.text.primary }, formatShortMonthDay(date)),
        ...events.map((event) => React.createElement(EventSummaryRow, {
          key: event.id,
          event,
          selected: selectedEventId === event.id,
          onPress: () => onSelectEvent(event),
          label: `${formatEventTime(event)}  ${event.title}`,
        })),
        events.length === 0
          ? React.createElement("tui-text", { color: colors.text.dim }, "No events")
          : null,
      );
    }),
  );
}

interface EventCalendarComponentType extends React.NamedExoticComponent<EventCalendarProps> {
  Month: typeof EventCalendarMonthView;
  Week: typeof EventCalendarWeekView;
  Day: typeof EventCalendarDayView;
  Agenda: typeof EventCalendarAgendaView;
}

const EventCalendarBase = React.memo(function EventCalendar(rawProps: EventCalendarProps): React.ReactElement {
  const colors = useColors();
  const personality = usePersonality();
  const props = usePluginProps("EventCalendar", rawProps);
  const {
    controller: controllerProp,
    events,
    anchorDate,
    defaultAnchorDate,
    onAnchorDateChange,
    view,
    defaultView,
    onViewChange,
    weekStartsOn = 0,
    agendaDays = 14,
    maxVisibleEventsPerDay = 1,
    selectedEventId: selectedEventIdProp,
    defaultSelectedEventId,
    onSelectEvent,
    isFocused = true,
  } = props;

  const hookOptions = {
    events,
    weekStartsOn,
    agendaDays,
    ...(anchorDate !== undefined ? { anchorDate } : {}),
    ...(defaultAnchorDate !== undefined ? { defaultAnchorDate } : {}),
    ...(onAnchorDateChange !== undefined ? { onAnchorDateChange } : {}),
    ...(view !== undefined ? { view } : {}),
    ...(defaultView !== undefined ? { defaultView } : {}),
    ...(onViewChange !== undefined ? { onViewChange } : {}),
  };

  const internalController = useEventCalendarBehavior(hookOptions);
  const controller = controllerProp ?? internalController;
  const [uncontrolledSelectedEventId, setUncontrolledSelectedEventId] = useState<string | undefined>(defaultSelectedEventId);
  const selectedEventId = selectedEventIdProp ?? uncontrolledSelectedEventId;

  const handleSelectEvent = useCallback((event: EventCalendarEvent) => {
    if (selectedEventIdProp === undefined) setUncontrolledSelectedEventId(event.id);
    onSelectEvent?.(event);
  }, [onSelectEvent, selectedEventIdProp]);

  const handleInput = useCallback((event: KeyEvent) => {
    if (event.key === "left" || event.key === "pageup") controller.prev();
    else if (event.key === "right" || event.key === "pagedown") controller.next();
    else if (event.key === "t") controller.goToToday();
    else if (event.key === "1") controller.setView("month");
    else if (event.key === "2") controller.setView("week");
    else if (event.key === "3") controller.setView("day");
    else if (event.key === "4") controller.setView("agenda");
  }, [controller]);

  useInput(handleInput, { isActive: isFocused });

  const rendererProps: EventCalendarViewRendererProps = {
    controller,
    maxVisibleEventsPerDay,
    selectedEventId,
    onSelectEvent: handleSelectEvent,
  };

  let body: React.ReactElement;
  if (controller.view === "week") body = React.createElement(EventCalendarWeekView, rendererProps);
  else if (controller.view === "day") body = React.createElement(EventCalendarDayView, rendererProps);
  else if (controller.view === "agenda") body = React.createElement(EventCalendarAgendaView, rendererProps);
  else body = React.createElement(EventCalendarMonthView, rendererProps);

  return React.createElement(
    "tui-box",
    {
      role: "region",
      "aria-label": props["aria-label"] ?? "Event calendar",
      flexDirection: "column",
      borderStyle: personality.borders.default,
      borderColor: colors.divider,
      paddingX: 1,
      ...(controller.view === "week" ? { minHeight: WEEK_CALENDAR_MIN_HEIGHT } : {}),
      ...pickLayoutProps(props),
    },
    React.createElement(
      "tui-box",
      { flexDirection: "row", justifyContent: "space-between" },
      React.createElement(
        "tui-box",
        { flexDirection: "column" },
        React.createElement("tui-text", { bold: true, color: colors.text.primary }, controller.title),
        controller.view === "month"
          ? null
          : React.createElement(
            "tui-text",
            { color: colors.text.dim },
            "PgUp/PgDn or ←/→ navigate · t today · 1/2/3/4 switch view",
          ),
      ),
      React.createElement(
        "tui-box",
        { flexDirection: "row", gap: 1 },
        React.createElement(EventCalendarControl, { label: "Prev", onPress: controller.prev }),
        React.createElement(EventCalendarControl, { label: "Today", onPress: controller.goToToday }),
        React.createElement(EventCalendarControl, { label: "Next", onPress: controller.next }),
      ),
    ),
    React.createElement(
      "tui-box",
      { flexDirection: "row", gap: 1 },
      React.createElement(EventCalendarControl, { label: "Month", active: controller.view === "month", onPress: () => controller.setView("month") }),
      React.createElement(EventCalendarControl, { label: "Week", active: controller.view === "week", onPress: () => controller.setView("week") }),
      React.createElement(EventCalendarControl, { label: "Day", active: controller.view === "day", onPress: () => controller.setView("day") }),
      React.createElement(EventCalendarControl, { label: "Agenda", active: controller.view === "agenda", onPress: () => controller.setView("agenda") }),
    ),
    React.createElement(
      "tui-box",
      { flexDirection: "column" },
      body,
    ),
  );
}) as EventCalendarComponentType;

EventCalendarBase.Month = EventCalendarMonthView;
EventCalendarBase.Week = EventCalendarWeekView;
EventCalendarBase.Day = EventCalendarDayView;
EventCalendarBase.Agenda = EventCalendarAgendaView;

export const EventCalendar = EventCalendarBase;
