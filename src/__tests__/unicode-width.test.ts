import { describe, expect, it } from "vitest";
import { stringWidth } from "../core/unicode.js";

describe("Unicode width", () => {
  it("treats emoji-presentation weather symbols as wide", () => {
    expect(stringWidth("☀️")).toBe(2);
    expect(stringWidth("☁️")).toBe(2);
    expect(stringWidth("☔️")).toBe(2);
    expect(stringWidth("❄️")).toBe(2);
  });

  it("keeps text-presentation weather symbols narrow", () => {
    expect(stringWidth("☀︎")).toBe(1);
    expect(stringWidth("☁︎")).toBe(1);
    expect(stringWidth("☔︎")).toBe(1);
    expect(stringWidth("❄︎")).toBe(1);
  });
});
