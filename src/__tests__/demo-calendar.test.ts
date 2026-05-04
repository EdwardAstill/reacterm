import { describe, expect, it } from "vitest";
import React from "react";
import { App as DemoApp } from "../../examples/reacterm-demo.js";
import { renderForTest } from "../testing/index.js";

describe("Demo calendar section", () => {
  function openCalendarSection(): ReturnType<typeof renderForTest> {
    const result = renderForTest(React.createElement(DemoApp), { width: 128, height: 32 });
    const sectionRow = result.lines.findIndex((line) => line.includes("▣ Calendar"));

    expect(sectionRow).toBeGreaterThanOrEqual(0);
    result.click(Math.max(1, result.lines[sectionRow]!.indexOf("Calendar")), sectionRow);

    return result;
  }

  function scrollToEventCalendar(result: ReturnType<typeof renderForTest>): void {
    for (let i = 0; i < 10; i++) result.scroll("down", 100, 20);
  }

  function clickControl(result: ReturnType<typeof renderForTest>, label: string): void {
    const row = result.lines.findIndex((line) => line.includes(label));
    expect(row).toBeGreaterThanOrEqual(0);
    result.click(result.lines[row]!.indexOf(label) + 2, row);
  }

  function expectWeekGrid(result: ReturnType<typeof renderForTest>, title: string): void {
    expect(result.hasText(title)).toBe(true);
    expect(result.hasText("Mon")).toBe(true);
    expect(result.hasText("Tue")).toBe(true);
    expect(result.hasText("Wed")).toBe(true);
    expect(result.hasText("Thu")).toBe(true);
    expect(result.hasText("Fri")).toBe(true);
    expect(result.hasText("Sat")).toBe(true);
    expect(result.hasText("Sun")).toBe(true);
    expect(result.lines.some((line) => (line.match(/╰─/g) ?? []).length >= 7)).toBe(true);
  }

  it("keeps the compact EventCalendar month view readable in the demo scroll path", () => {
    const result = openCalendarSection();

    for (let i = 0; i < 5; i++) result.scroll("down", 100, 20);

    const monthRow = result.lines.findIndex((line) => line.includes("[Month]"));
    expect(monthRow).toBeGreaterThanOrEqual(0);
    result.click(result.lines[monthRow]!.indexOf("[Month]") + 2, monthRow);

    for (let i = 0; i < 6; i++) result.scroll("down", 100, 20);

    expect(result.hasText("25")).toBe(true);
    expect(result.hasText("31")).toBe(true);
    expect(result.hasText("╰───────────╯")).toBe(true);
  });

  it("keeps demo EventCalendar week layout stable across previous and next", () => {
    const result = openCalendarSection();
    scrollToEventCalendar(result);

    expectWeekGrid(result, "May 4, 2026 - May 10, 2026");

    clickControl(result, "[Next]");
    expectWeekGrid(result, "May 11, 2026 - May 17, 2026");

    clickControl(result, "[Prev]");
    clickControl(result, "[Prev]");
    expectWeekGrid(result, "Apr 27, 2026 - May 3, 2026");
  });
});
