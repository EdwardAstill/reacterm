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

  it("treats default-emoji-presentation BMP codepoints as wide without VS16", () => {
    // Codepoints with Emoji_Presentation=Yes render as 2-cell glyphs
    // even without the U+FE0F variation selector.
    expect(stringWidth("⏰")).toBe(2); // U+23F0 alarm clock
    expect(stringWidth("⏳")).toBe(2); // U+23F3 hourglass flowing
    expect(stringWidth("⌚")).toBe(2); // U+231A watch
    expect(stringWidth("⚡")).toBe(2); // U+26A1 high voltage
    expect(stringWidth("✅")).toBe(2); // U+2705 white heavy check
    expect(stringWidth("❗")).toBe(2); // U+2757 heavy exclamation
    expect(stringWidth("⭐")).toBe(2); // U+2B50 star
    expect(stringWidth("⛔")).toBe(2); // U+26D4 no entry
  });

  it("keeps non-emoji-presentation BMP symbols narrow", () => {
    expect(stringWidth("✓")).toBe(1); // U+2713 check mark (text presentation default)
    expect(stringWidth("◎")).toBe(1); // U+25CE bullseye
    expect(stringWidth("◷")).toBe(1); // U+25F7 quarter clock
    expect(stringWidth("◧")).toBe(1); // U+25E7 square left
  });
});
