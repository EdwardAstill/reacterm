import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStyleSheetLoader, parseReactermCSS } from "../core/stylesheet-loader.js";

describe("Reacterm stylesheet formats", () => {
  it("parses Reacterm CSS through the public parser", () => {
    const parsed = parseReactermCSS(`
      :root { --reacterm-brand-primary: #ff00ff; }
      Text.title { color: var(--reacterm-brand-primary); bold: true; }
    `);

    expect(parsed.variables.get("--reacterm-brand-primary")).toBe("#ff00ff");
    expect(parsed.rules).toEqual([
      {
        selector: "Text.title",
        properties: { color: "#ff00ff", bold: true },
      },
    ]);
  });

  it("loads a .reacterm.css stylesheet", () => {
    const directory = mkdtempSync(join(tmpdir(), "reacterm-stylesheet-"));
    const filePath = join(directory, "app.reacterm.css");
    writeFileSync(filePath, "Text { color: cyan; }", "utf8");

    try {
      const loader = createStyleSheetLoader({ path: filePath, watch: false });
      expect(loader.stylesheet.rules).toEqual([
        { selector: "Text", properties: { color: "cyan" } },
      ]);
      loader.close();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it.each(["css", "json"] as const)("rejects the removed .%s stylesheet name", (format) => {
    const removedBrand = ["sto", "rm"].join("");
    const directory = mkdtempSync(join(tmpdir(), "reacterm-legacy-stylesheet-"));
    const filePath = join(directory, `app.${removedBrand}.${format}`);
    const source = format === "json"
      ? '{"Text":{"color":"cyan"}}'
      : "Text { color: cyan; }";
    writeFileSync(filePath, source, "utf8");

    try {
      expect(() => createStyleSheetLoader({ path: filePath, watch: false }))
        .toThrow(/Use \.reacterm\.(?:css|json)/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
