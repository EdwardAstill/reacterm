import { describe, expect, it } from "vitest";

import { buildWebRendererPage } from "../core/web-renderer-page.js";

describe("WebRenderer page builder", () => {
  it("builds the self-contained browser page", () => {
    const html = buildWebRendererPage({ title: "Storm TUI" });

    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("<title>Storm TUI</title>");
    expect(html).toContain('new WebSocket(protocol + "//" + location.host)');
    expect(html).toContain('id="grid"');
  });

  it("escapes the title the same way as the WebRenderer page", () => {
    const html = buildWebRendererPage({ title: "<Storm>" });

    expect(html).toContain("<title>&lt;Storm&gt;</title>");
    expect(html).toContain('<span class="title-text">&lt;Storm&gt;</span>');
    expect(html).not.toContain("<title><Storm></title>");
  });
});
