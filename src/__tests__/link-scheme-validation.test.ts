/**
 * <Link> URL scheme validation. Verifies that allowed schemes pass through
 * (children render, no warning) while disallowed schemes (javascript:, file:,
 * data:, …) trigger a one-time dev warning and fall back to plain-text
 * rendering. The cell-level OSC 8 emission lives in the live diff renderer
 * and is exercised by terminal-integration tests, not here.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { renderForTest } from "../testing/index.js";
import { Link, ALLOWED_LINK_SCHEMES, isAllowedLinkScheme } from "../components/index.js";

function renderLink(url: string, label: string) {
  return renderForTest(
    React.createElement(Link, { url, children: label } as React.ComponentProps<typeof Link>),
    { width: 40, height: 3 },
  );
}

describe("isAllowedLinkScheme", () => {
  it("accepts the documented allowlist", () => {
    for (const scheme of ALLOWED_LINK_SCHEMES) {
      expect(isAllowedLinkScheme(`${scheme}//example.com`)).toBe(true);
    }
  });

  it("is case-insensitive on the scheme", () => {
    expect(isAllowedLinkScheme("HTTPS://example.com")).toBe(true);
    expect(isAllowedLinkScheme("MailTo:user@example.com")).toBe(true);
  });

  it("rejects javascript:, file:, data:, vbscript:", () => {
    expect(isAllowedLinkScheme("javascript:alert(1)")).toBe(false);
    expect(isAllowedLinkScheme("file:///etc/passwd")).toBe(false);
    expect(isAllowedLinkScheme("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isAllowedLinkScheme("vbscript:msgbox(1)")).toBe(false);
  });

  it("rejects relative URLs and fragment-only URLs", () => {
    expect(isAllowedLinkScheme("./relative")).toBe(false);
    expect(isAllowedLinkScheme("/absolute-path")).toBe(false);
    expect(isAllowedLinkScheme("#anchor")).toBe(false);
    expect(isAllowedLinkScheme("")).toBe(false);
  });

  it("rejects non-string inputs", () => {
    expect(isAllowedLinkScheme(undefined as unknown as string)).toBe(false);
    expect(isAllowedLinkScheme(null as unknown as string)).toBe(false);
  });
});

describe("<Link> rendering", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("renders allowed-scheme links with children and no warning", () => {
    const result = renderLink("https://example.com", "Visit");
    expect(result.hasText("Visit")).toBe(true);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("renders mailto: without warning", () => {
    const result = renderLink("mailto:user@example.com", "Email");
    expect(result.hasText("Email")).toBe(true);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("warns once for javascript: and renders children as plain text", () => {
    const result = renderLink("javascript:alert(1)", "click");
    expect(result.hasText("click")).toBe(true);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toContain("javascript:alert(1)");
  });

  it("warns for file: and data: schemes", () => {
    const fileResult = renderLink("file:///etc/passwd", "leak");
    expect(fileResult.hasText("leak")).toBe(true);

    const dataResult = renderLink("data:text/html,<script>", "x");
    expect(dataResult.hasText("x")).toBe(true);

    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it("renders relative URLs as plain text with a warning", () => {
    const result = renderLink("./local", "rel");
    expect(result.hasText("rel")).toBe(true);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("renders empty url as plain text without warning (no link to validate)", () => {
    const result = renderLink("", "empty");
    expect(result.hasText("empty")).toBe(true);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("only warns once per unique disallowed URL across renders", () => {
    // Use a URL no earlier test has seen — module-level dedupe cache persists.
    const unique = "vbscript:dedupe-check";
    renderLink(unique, "a");
    renderLink(unique, "b");
    renderLink(unique, "c");
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
