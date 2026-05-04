import { describe, expect, it } from "vitest";
import React from "react";
import { Box, EventCalendar, ScrollView, Text } from "../components/index.js";
import { useInput } from "../hooks/useInput.js";
import { useEventCalendarBehavior, type EventCalendarEvent } from "../hooks/index.js";
import { renderForTest } from "../testing/index.js";

const EVENTS: EventCalendarEvent[] = [
  {
    id: "kickoff",
    title: "Kickoff",
    start: new Date(2026, 4, 4, 9, 0),
    end: new Date(2026, 4, 4, 10, 0),
    color: "cyan",
  },
  {
    id: "standup",
    title: "Standup",
    start: new Date(2026, 4, 14, 9, 30),
    end: new Date(2026, 4, 14, 10, 0),
    color: "green",
  },
  {
    id: "review",
    title: "Design Review",
    start: new Date(2026, 4, 14, 13, 0),
    end: new Date(2026, 4, 14, 14, 30),
    color: "yellow",
  },
  {
    id: "offsite",
    title: "Team Offsite",
    start: new Date(2026, 4, 15, 0, 0),
    end: new Date(2026, 4, 15, 23, 59),
    allDay: true,
    color: "magenta",
  },
];

function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function clickSemanticNode(result: ReturnType<typeof renderForTest>, testId: string): void {
  const node = result.metadata.semanticNodes.find((entry) => entry.testId === testId);
  expect(node).toBeDefined();
  result.click(node!.bounds.x, node!.bounds.y);
}

function expectCompleteWeekColumns(result: ReturnType<typeof renderForTest>): void {
  expect(result.lines.some((line) => (line.match(/╰─/g) ?? []).length >= 7)).toBe(true);
}

function ControllerProbe(): React.ReactElement {
  const controller = useEventCalendarBehavior({
    events: EVENTS,
    defaultAnchorDate: new Date(2026, 4, 14),
    defaultView: "month",
    weekStartsOn: 1,
    agendaDays: 7,
    today: new Date(2026, 4, 14),
  });

  useInput((event) => {
    if (event.key === "n") controller.next();
    else if (event.key === "p") controller.prev();
    else if (event.key === "w") controller.setView("week");
    else if (event.key === "d") controller.setView("day");
    else if (event.key === "a") controller.setView("agenda");
    else if (event.key === "m") controller.setView("month");
    else if (event.key === "t") controller.goToToday();
  }, { isActive: true });

  return React.createElement(
    Box,
    { flexDirection: "column" },
    React.createElement(Text, null, controller.view),
    React.createElement(Text, null, controller.title),
    React.createElement(Text, null, `${formatDate(controller.visibleStart)}|${formatDate(controller.visibleEnd)}`),
    React.createElement(Text, null, controller.getEventsForDay(new Date(2026, 4, 14)).map((event) => event.title).join(", ")),
  );
}

describe("useEventCalendarBehavior", () => {
  it("computes month ranges, buckets events, and supports view navigation", () => {
    const result = renderForTest(React.createElement(ControllerProbe), { width: 80, height: 10 });

    expect(result.hasText("month")).toBe(true);
    expect(result.hasText("May 2026")).toBe(true);
    expect(result.hasText("2026-04-27|2026-05-31")).toBe(true);
    expect(result.hasText("Standup, Design Review")).toBe(true);

    result.fireKey("w");
    expect(result.hasText("week")).toBe(true);
    expect(result.hasText("2026-05-11|2026-05-17")).toBe(true);

    result.fireKey("n");
    expect(result.hasText("2026-05-18|2026-05-24")).toBe(true);

    result.fireKey("d");
    expect(result.hasText("day")).toBe(true);
    expect(result.hasText("May 21, 2026")).toBe(true);

    result.fireKey("a");
    expect(result.hasText("agenda")).toBe(true);
    expect(result.hasText("Agenda: May 21, 2026 - May 27, 2026")).toBe(true);

    result.fireKey("t");
    expect(result.hasText("Agenda: May 14, 2026 - May 20, 2026")).toBe(true);
  });
});

describe("EventCalendar", () => {
  it("renders month event blocks", () => {
    const result = renderForTest(
      React.createElement(EventCalendar, {
        events: EVENTS,
        defaultAnchorDate: new Date(2026, 4, 14),
        defaultView: "month",
        weekStartsOn: 1,
        isFocused: false,
        maxVisibleEventsPerDay: 2,
      }),
      { width: 140, height: 40 },
    );

    expect(result.hasText("Kickoff")).toBe(true);
    expect(result.hasText("Standup")).toBe(true);
    expect(result.hasText("Design")).toBe(true);
    expect(result.hasText("Month")).toBe(true);
  });

  it("keeps the complete month grid visible in a normal terminal height", () => {
    const result = renderForTest(
      React.createElement(EventCalendar, {
        events: EVENTS,
        defaultAnchorDate: new Date(2026, 4, 14),
        defaultView: "month",
        weekStartsOn: 1,
        isFocused: false,
      }),
      { width: 104, height: 28 },
    );

    const weekBottomRows = result.lines.filter((line) => line.includes("╰────────"));
    expect(weekBottomRows.length).toBeGreaterThanOrEqual(5);
    expect(result.hasText("31")).toBe(true);
    expect(result.hasText("+1")).toBe(true);
  });

  it("renders week, day, and agenda views from the same controller shape", () => {
    const week = renderForTest(
      React.createElement(EventCalendar, {
        events: EVENTS,
        defaultAnchorDate: new Date(2026, 4, 14),
        defaultView: "week",
        weekStartsOn: 1,
        isFocused: false,
      }),
      { width: 160, height: 35 },
    );
    expect(week.hasText("Team Offsit")).toBe(true);
    expect(week.hasText("All day")).toBe(true);
    expect(week.hasText("No events")).toBe(true);

    const day = renderForTest(
      React.createElement(EventCalendar, {
        events: EVENTS,
        defaultAnchorDate: new Date(2026, 4, 15),
        defaultView: "day",
        isFocused: false,
      }),
      { width: 100, height: 30 },
    );
    expect(day.hasText("All day")).toBe(true);
    expect(day.hasText("Team Offsite")).toBe(true);

    const agenda = renderForTest(
      React.createElement(EventCalendar, {
        events: EVENTS,
        defaultAnchorDate: new Date(2026, 4, 14),
        defaultView: "agenda",
        agendaDays: 4,
        isFocused: false,
      }),
      { width: 100, height: 30 },
    );
    expect(agenda.hasText("Agenda")).toBe(true);
    expect(agenda.hasText("9:30 AM-10:00 AM  Standup")).toBe(true);
    expect(agenda.hasText("All day  Team Offsite")).toBe(true);
  });

  it("week view fits within a parent ScrollView without relying on clipped vertical overflow", () => {
    const ref = { current: null } as React.MutableRefObject<any>;
    const result = renderForTest(
      React.createElement(
        ScrollView,
        { height: 14, scrollStateRef: ref },
        React.createElement(EventCalendar, {
          events: EVENTS,
          defaultAnchorDate: new Date(2026, 4, 14),
          defaultView: "week",
          weekStartsOn: 1,
          isFocused: false,
        }),
      ),
      { width: 96, height: 18 },
    );

    expect(ref.current).not.toBeNull();
    expect(ref.current.maxScroll).toBe(0);
    expect(result.hasText("Team Off")).toBe(true);
    expect(result.hasText("All day")).toBe(true);
  });

  it("week view adapts to compact width while keeping all seven days visible", () => {
    const result = renderForTest(
      React.createElement(EventCalendar, {
        events: EVENTS,
        defaultAnchorDate: new Date(2026, 4, 14),
        defaultView: "week",
        weekStartsOn: 1,
        isFocused: false,
      }),
      { width: 72, height: 24 },
    );

    expect(result.hasText("Mon")).toBe(true);
    expect(result.hasText("Tue")).toBe(true);
    expect(result.hasText("Wed")).toBe(true);
    expect(result.hasText("Thu")).toBe(true);
    expect(result.hasText("Fri")).toBe(true);
    expect(result.hasText("Sat")).toBe(true);
    expect(result.hasText("Sun")).toBe(true);
    expect(result.lines.some((line) => line.includes("━"))).toBe(false);
  });

  it("keeps the week columns complete in compact viewports", () => {
    const result = renderForTest(
      React.createElement(EventCalendar, {
        events: EVENTS,
        defaultAnchorDate: new Date(2026, 4, 14),
        defaultView: "week",
        weekStartsOn: 1,
        isFocused: false,
      }),
      { width: 104, height: 14 },
    );

    expectCompleteWeekColumns(result);
    expect(result.hasText("Standup")).toBe(true);
    expect(result.hasText("Design")).toBe(true);
  });

  it("keeps week columns complete after previous and next navigation", () => {
    const result = renderForTest(
      React.createElement(EventCalendar, {
        events: EVENTS,
        defaultAnchorDate: new Date(2026, 4, 4),
        defaultView: "week",
        weekStartsOn: 1,
        isFocused: true,
      }),
      { width: 104, height: 14 },
    );

    result.fireKey("pagedown");
    expect(result.hasText("May 11, 2026 - May 17, 2026")).toBe(true);
    expect(result.hasText("Standup")).toBe(true);
    expect(result.hasText("Sun 17")).toBe(true);
    expectCompleteWeekColumns(result);

    result.fireKey("pageup");
    result.fireKey("pageup");
    expect(result.hasText("Apr 27, 2026 - May 3, 2026")).toBe(true);
    expect(result.hasText("No events")).toBe(true);
    expect(result.hasText("Sun 3")).toBe(true);
    expectCompleteWeekColumns(result);
  });

  it("supports mouse selection for events and keeps two same-day events independently clickable", () => {
    function Probe(): React.ReactElement {
      const [selectedEventId, setSelectedEventId] = React.useState("standup");
      const selectedEvent = EVENTS.find((event) => event.id === selectedEventId) ?? EVENTS[0]!;

      return React.createElement(
        Box,
        { flexDirection: "column" },
        React.createElement(EventCalendar, {
          events: EVENTS,
          defaultAnchorDate: new Date(2026, 4, 14),
          defaultView: "week",
          weekStartsOn: 1,
          selectedEventId,
          onSelectEvent: (event) => setSelectedEventId(event.id),
          isFocused: false,
        }),
        React.createElement(Text, null, `Selected: ${selectedEvent.title}`),
      );
    }

    const result = renderForTest(React.createElement(Probe), { width: 120, height: 30 });

    expect(result.hasText("Selected: Standup")).toBe(true);

    clickSemanticNode(result, "event-calendar-event-review");
    expect(result.hasText("Selected: Design Review")).toBe(true);

    clickSemanticNode(result, "event-calendar-event-standup");
    expect(result.hasText("Selected: Standup")).toBe(true);
  });
});
