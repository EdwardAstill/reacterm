import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { renderForTest } from "../testing/index.js";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";

function Probe({ value, delay }: { value: string; delay: number }) {
  const debounced = useDebouncedValue(value, delay);
  return React.createElement("tui-text", null, `[${debounced}]`);
}

describe("useDebouncedValue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns the initial value synchronously on first render", () => {
    const result = renderForTest(
      React.createElement(Probe, { value: "a", delay: 50 }),
      { width: 20, height: 1 },
    );
    expect(result.output).toContain("[a]");
  });

  it("debounces rapid updates so only the trailing value is emitted", () => {
    const result = renderForTest(
      React.createElement(Probe, { value: "a", delay: 50 }),
      { width: 20, height: 1 },
    );
    expect(result.output).toContain("[a]");

    result.rerender(React.createElement(Probe, { value: "b", delay: 50 }));
    result.rerender(React.createElement(Probe, { value: "c", delay: 50 }));
    expect(result.output).toContain("[a]");

    vi.advanceTimersByTime(60);
    result.rerender(React.createElement(Probe, { value: "c", delay: 50 }));
    expect(result.output).toContain("[c]");
  });
});
