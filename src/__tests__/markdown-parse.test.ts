import { describe, expect, it } from "vitest";
import { parseBlocks, parseInline } from "../utils/markdown/parse.js";

describe("parseInline", () => {
  it("parses bold and italic", () => {
    const tokens = parseInline("a **b** _c_ d");
    expect(tokens).toEqual([
      { type: "text", value: "a " },
      { type: "bold", children: [{ type: "text", value: "b" }] },
      { type: "text", value: " " },
      { type: "italic", children: [{ type: "text", value: "c" }] },
      { type: "text", value: " d" },
    ]);
  });

  it("parses inline code, link, image", () => {
    const tokens = parseInline("`x` [t](u) ![a](u)");
    expect(tokens).toEqual([
      { type: "code", value: "x" },
      { type: "text", value: " " },
      { type: "link", text: "t", url: "u" },
      { type: "text", value: " " },
      { type: "image", alt: "a", url: "u" },
    ]);
  });

  it("parses bolditalic, strikethrough, escape", () => {
    expect(parseInline("***b*** ~~s~~ \\*esc")).toEqual([
      { type: "bolditalic", children: [{ type: "text", value: "b" }] },
      { type: "text", value: " " },
      { type: "strikethrough", children: [{ type: "text", value: "s" }] },
      { type: "text", value: " *esc" },
    ]);
  });
});

describe("parseBlocks", () => {
  it("parses headings 1..6", () => {
    const blocks = parseBlocks("# A\n## B\n### C\n#### D\n##### E\n###### F\n");
    expect(blocks).toEqual([
      { type: "heading", level: 1, text: "A" },
      { type: "heading", level: 2, text: "B" },
      { type: "heading", level: 3, text: "C" },
      { type: "heading", level: 4, text: "D" },
      { type: "heading", level: 5, text: "E" },
      { type: "heading", level: 6, text: "F" },
    ]);
  });

  it("parses GFM table with alignment", () => {
    const md = "| a | b | c |\n|:--|:-:|--:|\n| 1 | 2 | 3 |\n";
    const blocks = parseBlocks(md);
    expect(blocks).toEqual([
      {
        type: "table",
        headers: ["a", "b", "c"],
        alignments: ["left", "center", "right"],
        rows: [["1", "2", "3"]],
      },
    ]);
  });

  it("parses fenced code with language", () => {
    const blocks = parseBlocks("```ts\nlet x = 1\n```\n");
    expect(blocks).toEqual([{ type: "codeblock", language: "ts", content: "let x = 1" }]);
  });

  it("parses unordered list with nested + task items", () => {
    const md = "- a\n- [x] b\n  - c\n";
    const blocks = parseBlocks(md);
    expect(blocks).toEqual([
      {
        type: "ulist",
        items: [
          { text: "a", checked: undefined, ordered: false, start: 1, children: [] },
          {
            text: "b",
            checked: true,
            ordered: false,
            start: 1,
            children: [
              { text: "c", checked: undefined, ordered: false, start: 1, children: [] },
            ],
          },
        ],
      },
    ]);
  });

  it("parses blockquote and hr", () => {
    expect(parseBlocks("> q\n\n---\n")).toEqual([
      { type: "blockquote", lines: ["q"] },
      { type: "hr" },
    ]);
  });
});
