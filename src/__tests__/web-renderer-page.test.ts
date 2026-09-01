import { describe, expect, it } from "vitest";

import { buildWebRendererPage } from "../core/web-renderer-page.js";

describe("WebRenderer page builder", () => {
  it("builds the self-contained browser page", () => {
    const html = buildWebRendererPage({ title: "Reacterm TUI" });

    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("<title>Reacterm TUI</title>");
    expect(html).toContain('new WebSocket(protocol + "//" + location.host)');
    expect(html).toContain('id="grid"');
  });

  it("escapes the title the same way as the WebRenderer page", () => {
    const html = buildWebRendererPage({ title: "<Reacterm>" });

    expect(html).toContain("<title>&lt;Reacterm&gt;</title>");
    expect(html).toContain('<span class="title-text">&lt;Reacterm&gt;</span>');
    expect(html).not.toContain("<title><Reacterm></title>");
  });
});
