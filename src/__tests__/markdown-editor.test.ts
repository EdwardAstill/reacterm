import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { renderForTest } from "../testing/index.js";
import { MarkdownEditor } from "../components/extras/MarkdownEditor.js";

describe("MarkdownEditor", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("renders editor pane and preview pane side by side", () => {
    const result = renderForTest(
      React.createElement(MarkdownEditor, {
        value: "# Hi\n",
        onChange: () => {},
        previewDelayMs: 0,
        rows: 6,
      }),
      { width: 80, height: 12 },
    );
    expect(result.output).toContain("Editor");
    expect(result.output).toContain("Preview");
    expect(result.output).toContain("HI");
  });

  it("preview reflects controlled value updates after debounce elapses", () => {
    const result = renderForTest(
      React.createElement(MarkdownEditor, {
        value: "# A\n",
        onChange: () => {},
        previewDelayMs: 50,
        rows: 6,
      }),
      { width: 80, height: 12 },
    );
    expect(result.output).toContain("A");

    result.rerender(
      React.createElement(MarkdownEditor, {
        value: "# B\n",
        onChange: () => {},
        previewDelayMs: 50,
        rows: 6,
      }),
    );

    vi.advanceTimersByTime(60);
    result.rerender(
      React.createElement(MarkdownEditor, {
        value: "# B\n",
        onChange: () => {},
        previewDelayMs: 50,
        rows: 6,
      }),
    );

    expect(result.output).toContain("B");
  });

  it("Tab cycles focus state without crashing", () => {
    const result = renderForTest(
      React.createElement(MarkdownEditor, {
        value: "body",
        onChange: () => {},
        previewDelayMs: 0,
        rows: 4,
      }),
      { width: 80, height: 8 },
    );
    expect(result.output).toContain("Preview");
    result.fireKey("tab");
    expect(result.output).toContain("Preview");
  });
});
