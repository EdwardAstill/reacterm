import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderForTest } from "../testing/index.js";
import { ShowcaseRichContent } from "../templates/showcase/ShowcaseRichContent.js";

vi.mock("../components/extras/Markdown.js", () => ({
  Markdown: () => null,
}));

describe("ShowcaseRichContent", () => {
  it("renders a Reacterm banner fallback when no image path is supplied", () => {
    const result = renderForTest(
      React.createElement(ShowcaseRichContent),
      { width: 80, height: 24 },
    );

    expect(result.hasText("Reacterm Terminal UI")).toBe(true);
  });
});
