import { describe, expect, it } from "vitest";
import React from "react";
import { Box, EventCalendar, ScrollView, Text } from "../components/index.js";
import type { EventCalendarEvent } from "../hooks/index.js";
import { renderForTest } from "../testing/index.js";

describe("layout engine scroll measurement", () => {
  it("counts post-flex wrapped height for row children inside a ScrollView", () => {
    const ref = { current: null } as React.MutableRefObject<any>;

    const result = renderForTest(
      React.createElement(
        ScrollView,
        { height: 8, scrollStateRef: ref },
        React.createElement(
          Box,
          { flexDirection: "row", gap: 1 },
          ...Array.from({ length: 7 }, (_, index) => React.createElement(
            Box,
            {
              key: `day-${index}`,
              flex: 1,
              minHeight: 6,
              flexDirection: "column",
              borderStyle: "round",
              paddingX: 1,
              gap: 1,
            },
            React.createElement(Text, { bold: true }, `Day ${index + 1}`),
            React.createElement(Text, null, "Long planning review item with several wrapped words"),
            React.createElement(Text, null, "Another long event block that should force more height"),
          )),
        ),
      ),
      { width: 72, height: 12 },
    );

    expect(ref.current).not.toBeNull();
    expect(ref.current.maxScroll).toBeGreaterThan(0);

    result.fireKey("pagedown");
    expect(ref.current.clampedTop).toBeGreaterThan(0);
  });

  it("keeps compact EventCalendar week view from creating vertical outer overflow", () => {
    const ref = { current: null } as React.MutableRefObject<any>;
    const today = new Date(2026, 4, 8);
    const events: EventCalendarEvent[] = [
      {
        id: "roadmap",
        title: "Roadmap review and dependency alignment",
        start: new Date(2026, 4, 8, 9, 0),
        end: new Date(2026, 4, 8, 10, 30),
        color: "cyan",
        location: "North room",
      },
      {
        id: "standup",
        title: "Design standup with a very long status title",
        start: new Date(2026, 4, 9, 10, 0),
        end: new Date(2026, 4, 9, 10, 30),
        color: "green",
      },
      {
        id: "offsite",
        title: "Team Offsite",
        start: new Date(2026, 4, 10, 0, 0),
        end: new Date(2026, 4, 10, 23, 59),
        allDay: true,
        color: "yellow",
        location: "Fremantle waterfront campus",
      },
    ];

    const result = renderForTest(
      React.createElement(
        ScrollView,
        { height: 14, scrollStateRef: ref },
        React.createElement(
          Box,
          { flexDirection: "column", gap: 1 },
          React.createElement(Text, null, "Header"),
          React.createElement(EventCalendar, {
            events,
            defaultAnchorDate: today,
            defaultView: "week",
            weekStartsOn: 1,
            isFocused: false,
          }),
          React.createElement(Text, null, "Footer"),
        ),
      ),
      { width: 96, height: 18 },
    );

    expect(ref.current).not.toBeNull();
    expect(ref.current.maxScroll).toBe(0);
    expect(result.hasText("Roadmap")).toBe(true);

    result.fireKey("pagedown");
    expect(ref.current.clampedTop).toBe(0);
  });
});
