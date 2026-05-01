# Markdown/Pretty Parser Split + MarkdownEditor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development to implement this plan task-by-task when tasks are independent. For same-session manual execution, follow this plan directly. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the Markdown parser/render-blocks and the Pretty `formatValue` walker from their components into `src/utils/`, add unit-test coverage, then build a new `MarkdownEditor` composite that pairs `Editor` + `Markdown` with a debounced re-parse.

**Architecture:** Two phases. Phase A is a pure refactor that pulls non-React logic out of `Markdown.tsx` (742 lines) and `Pretty.tsx` (~417 lines) into `src/utils/markdown/parse.ts`, `src/utils/markdown/render-blocks.tsx`, and `src/utils/pretty-format.ts`. Components become thin orchestrators that call the utils. Phase B adds a `useDebouncedValue` hook and a `MarkdownEditor` component that side-by-sides `Editor` and `Markdown` panes with a debounced re-parse on the preview side. Phase A is preparatory — its split-out parser modules unblock cheap re-parse + alternative rendering paths used by Phase B and any future variant (streaming markdown, SSH-side render).

**Tech Stack:** TypeScript (strict), React reconciler, Vitest, Bun. No new runtime deps.

**Status:** draft
**Refinement passes:** 0

---

## Context (consolidated from quick-mode brainstorming on 2026-05-01)

Both `Markdown` and `Pretty` already exist and are correctly placed at the component layer (not the renderer layer). User-facing requests for "markdown rendering with heading colors / tables" and "JSON as tree" are already shipped:
- `src/components/extras/Markdown.tsx` — H1-H6 colored, GFM tables drawn with box glyphs, lists, blockquote, codeblock, hr, inline formatting.
- `src/components/extras/MarkdownViewer.tsx` — Markdown + ScrollView + TOC sidebar.
- `src/components/data/Pretty.tsx` — interactive collapsible JSON tree with theme colors and search highlight.

Two future-work items were approved out of brainstorming:
1. **Split parsers into `utils/`** (Phase A here): improves testability + maintainability. Markdown.tsx is the largest `extras/` file. Matches existing project pattern (`src/utils/table-render.ts`, `src/utils/highlight.ts`).
2. **Build `MarkdownEditor`** (Phase B here): ROADMAP §B3. Editor + live preview with debounced re-parse.

The third item (`usePrettyBehavior` headless extraction) was explicitly **rejected** as YAGNI — no second consumer.

## Non-goals

- No streaming-Markdown variant in this plan (unlocked but not built).
- No syntax highlight for fenced code blocks beyond current "language label only" behavior.
- No `usePrettyBehavior` hook.
- No reorganisation of `Markdown.tsx` table renderer to share code with `Table.tsx` — different render contract.
- No file rename of `extras/` → `composites/` (ROADMAP C3 item — separate work).

## Recommended Skills

- `test-driven-development` — every task starts with a failing test
- `typescript` — strict tsconfig discipline, generics on small parser surface
- `large-refactor` — Phase A is a parallel-change refactor that must keep tests green
- `tui` — Phase B layout decisions on the editor split
- `git` — frequent commits per skill convention

## Recommended MCPs

none

---

## File Structure

### Phase A — Parser/formatter split

**Create:**
- `src/utils/markdown/parse.ts` — pure parser. Exports `parseInline`, `parseBlocks`, types `InlineToken`, `Block`, `ListNode`.
- `src/utils/markdown/render-blocks.tsx` — block + inline → `tui-box`/`tui-text` element renderers. Exports `renderBlock`, `renderInlineText`, `renderInlineTokens`, `renderListItems`, `renderTable`, `InlineRenderContext`.
- `src/utils/pretty-format.ts` — pure walker. Exports `formatValue`, type `Line`.
- `src/__tests__/markdown-parse.test.ts` — parser-level tests (pure data in, AST out).
- `src/__tests__/pretty-format.test.ts` — formatter-level tests (data in, lines out).
- `src/__tests__/markdown.test.ts` — component snapshot test (covers renderer integration).

**Modify:**
- `src/components/extras/Markdown.tsx` — drops parser + render helpers, becomes thin orchestrator that calls `parseBlocks` + `renderBlock`.
- `src/components/data/Pretty.tsx` — drops `formatValue`, imports it from the util.

### Phase B — MarkdownEditor

**Create:**
- `src/hooks/useDebouncedValue.ts` — exports `useDebouncedValue<T>(value: T, delayMs: number): T`. Uses `useCleanup` for timer teardown per project conventions.
- `src/components/extras/MarkdownEditor.tsx` — composite. Owns split layout (horizontal pane), focus model (Tab cycles editor ↔ preview), debounced re-parse.
- `src/__tests__/use-debounced-value.test.ts` — hook unit test.
- `src/__tests__/markdown-editor.test.ts` — component test (renderToString, fireEvent typing, focus toggle).
- `examples/ui-terminal/showcase/markdown-editor.tsx` — runnable demo.

**Modify:**
- `src/components/index.ts` — export `MarkdownEditor` + `MarkdownEditorProps`.
- `src/index.ts` — re-export the same.
- `src/hooks/index.ts` — export `useDebouncedValue`.
- `docs/components/content.md` — add `### MarkdownEditor` section.
- `docs/features.md` — add row in the components table.
- `docs/hook-guide.md` — short entry for `useDebouncedValue`.

---

## Tasks

### Task 1: Lock current Markdown parser behavior with tests before extracting

**Files:**
- Create: `src/__tests__/markdown-parse.test.ts`

**Invoke skill:** `@test-driven-development` for this task.

- [ ] **Step 1: Write the failing test against the still-internal parser**

Tests target the parser as if it were already the public util at `src/utils/markdown/parse.ts`. Imports will fail until the move; that's exactly the gate.

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/__tests__/markdown-parse.test.ts`
Expected: FAIL — module `../utils/markdown/parse.js` not found.

- [ ] **Step 3: Confirm fail reason is the missing module, not assertion mismatch**

Read failure output. Should be a resolution error from Vitest, not a `toEqual` failure.

- [ ] **Step 4: Commit the failing test**

```bash
git add src/__tests__/markdown-parse.test.ts
git commit -m "test(markdown): add parser tests targeting future utils/markdown/parse.ts"
```

---

### Task 2: Extract Markdown parser to `src/utils/markdown/parse.ts`

**Files:**
- Create: `src/utils/markdown/parse.ts`
- Modify: `src/components/extras/Markdown.tsx`

**Invoke skill:** `@large-refactor` — parallel-change move with tests as the safety net.

- [ ] **Step 1: Move types + `parseInline` + `parseBlocks` verbatim into `src/utils/markdown/parse.ts`**

Lift lines `src/components/extras/Markdown.tsx:14-381` into the new file. Export every symbol the component needs: `InlineToken`, `Block`, `ListNode`, `parseInline`, `parseBlocks`. Imports needed: none (parser is pure TS, no React).

- [ ] **Step 2: Replace inline definitions in `Markdown.tsx` with an import**

```ts
import {
  parseBlocks,
  parseInline,
  type Block,
  type InlineToken,
  type ListNode,
} from "../../utils/markdown/parse.js";
```

Delete the moved declarations from `Markdown.tsx`. Keep `renderInlineTokens`, `renderInlineText`, `renderListItems`, `renderTable`, `renderBlock`, and the component itself in place for now — Task 3 moves those.

- [ ] **Step 3: Run parser tests + the focused component test**

```bash
bun test src/__tests__/markdown-parse.test.ts
bun x tsc --noEmit
```

Expected: parse tests PASS, typecheck clean.

- [ ] **Step 4: Run the broader suite to confirm no regression**

```bash
bun test
```

Expected: every previously-passing test still passes.

- [ ] **Step 5: Commit**

```bash
git add src/utils/markdown/parse.ts src/components/extras/Markdown.tsx
git commit -m "refactor(markdown): extract parser to src/utils/markdown/parse.ts"
```

---

### Task 3: Extract Markdown render helpers to `src/utils/markdown/render-blocks.tsx`

**Files:**
- Create: `src/utils/markdown/render-blocks.tsx`
- Modify: `src/components/extras/Markdown.tsx`

**Invoke skill:** `@large-refactor`

- [ ] **Step 1: Write a failing component-level test that locks current rendering behavior**

```ts
// src/__tests__/markdown.test.ts
import { describe, expect, it } from "vitest";
import React from "react";
import { renderToString } from "../testing/index.js";
import { Markdown } from "../components/extras/Markdown.js";

describe("Markdown component", () => {
  it("renders an H1 transformed to upper-case with underline bar", () => {
    const out = renderToString(React.createElement(Markdown, { content: "# hello\n" }), {
      width: 30,
      height: 5,
    });
    expect(out).toContain("HELLO");
    expect(out).toMatch(/─{5,}/);
  });

  it("renders a GFM table with box-drawing borders", () => {
    const md = "| a | b |\n|---|---|\n| 1 | 2 |\n";
    const out = renderToString(React.createElement(Markdown, { content: md }), {
      width: 30,
      height: 6,
    });
    expect(out).toContain("┌");
    expect(out).toContain("┤");
    expect(out).toContain("│");
    expect(out).toMatch(/a\s+│\s+b/);
  });
});
```

- [ ] **Step 2: Run the new component test to verify it passes against the current implementation**

```bash
bun test src/__tests__/markdown.test.ts
```

Expected: PASS. (This locks behavior **before** the move.)

- [ ] **Step 3: Move the render helpers to `src/utils/markdown/render-blocks.tsx`**

Lift `InlineRenderContext`, `renderInlineTokens`, `renderInlineText`, `BULLET_MARKERS`, `renderListItems`, `renderTable`, `renderBlock` from `Markdown.tsx` into the new file. The util imports types from `./parse.js`, plus the existing `useColors` / `usePersonality` types via:

```ts
import React from "react";
import type { Block, InlineToken, ListNode } from "./parse.js";
import type { useColors } from "../../hooks/useColors.js";
import type { usePersonality } from "../../core/personality.js";
import { padCell } from "../format.js";

export interface InlineRenderContext {
  colors: ReturnType<typeof useColors>;
  personality: ReturnType<typeof usePersonality>;
}
```

Export every symbol: `InlineRenderContext`, `renderInlineTokens`, `renderInlineText`, `renderListItems`, `renderTable`, `renderBlock`.

- [ ] **Step 4: Replace inline helpers in `Markdown.tsx` with imports**

```ts
import {
  renderBlock,
  type InlineRenderContext,
} from "../../utils/markdown/render-blocks.js";
```

Delete the moved declarations. The component body collapses to: `useColors`, `usePersonality`, `usePluginProps`, `useMemo` over `parseBlocks`, map → `renderBlock`, `tui-box` outer.

- [ ] **Step 5: Run the locked component test + typecheck**

```bash
bun test src/__tests__/markdown.test.ts
bun x tsc --noEmit
```

Expected: PASS, clean.

- [ ] **Step 6: Run full suite**

```bash
bun test
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/utils/markdown/render-blocks.tsx src/components/extras/Markdown.tsx src/__tests__/markdown.test.ts
git commit -m "refactor(markdown): extract render-blocks to src/utils/markdown/render-blocks.tsx"
```

---

### Task 4: Lock current Pretty `formatValue` behavior with tests before extracting

**Files:**
- Create: `src/__tests__/pretty-format.test.ts`

**Invoke skill:** `@test-driven-development`

- [ ] **Step 1: Write the failing test against the future util**

```ts
import { describe, expect, it } from "vitest";
import { formatValue } from "../utils/pretty-format.js";

const colors = {
  text: { primary: "#fff", secondary: "#aaa", dim: "#555" },
  brand: { primary: "#80f", light: "#a8f" },
  success: "#0c0",
  info: "#08c",
} as unknown as Parameters<typeof formatValue>[7];

describe("formatValue", () => {
  it("formats primitives with color tags", () => {
    expect(formatValue("x", 2, true, 5, 0, "", "$", new Set(), colors)).toEqual([
      { text: '"x"', color: "#0c0", path: "$" },
    ]);
    expect(formatValue(42, 2, true, 5, 0, "", "$", new Set(), colors)).toEqual([
      { text: "42", color: "#a8f", path: "$" },
    ]);
    expect(formatValue(true, 2, true, 5, 0, "", "$", new Set(), colors)).toEqual([
      { text: "true", color: "#80f", path: "$" },
    ]);
    expect(formatValue(null, 2, true, 5, 0, "", "$", new Set(), colors)).toEqual([
      { text: "null", color: "#555", path: "$" },
    ]);
  });

  it("emits multi-line array with trailing commas", () => {
    const lines = formatValue([1, 2], 2, false, 5, 0, "", "$", new Set(), colors);
    expect(lines.map((l) => l.text)).toEqual(["[", "  1,", "  2", "]"]);
  });

  it("collapses object when path is in collapsedPaths", () => {
    const collapsed = new Set(["$"]);
    const lines = formatValue({ a: 1, b: 2 }, 2, false, 5, 0, "", "$", collapsed, colors);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.text).toBe("{...2}");
    expect(lines[0]!.collapsible).toBe(true);
    expect(lines[0]!.isCollapsed).toBe(true);
  });

  it("guards depth and circular refs", () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    const lines = formatValue(obj, 2, false, 3, 0, "", "$", new Set(), colors);
    const joined = lines.map((l) => l.text).join("\n");
    expect(joined).toContain("[Circular]");
  });
});
```

- [ ] **Step 2: Run to verify it fails on missing module**

Run: `bun test src/__tests__/pretty-format.test.ts`
Expected: FAIL — `src/utils/pretty-format.js` not found.

- [ ] **Step 3: Commit the failing test**

```bash
git add src/__tests__/pretty-format.test.ts
git commit -m "test(pretty): add formatter tests targeting future utils/pretty-format.ts"
```

---

### Task 5: Extract `formatValue` + `Line` type to `src/utils/pretty-format.ts`

**Files:**
- Create: `src/utils/pretty-format.ts`
- Modify: `src/components/data/Pretty.tsx`

**Invoke skill:** `@large-refactor`

- [ ] **Step 1: Lift `Line` interface and `formatValue` function verbatim into the new file**

Lines `src/components/data/Pretty.tsx:108-252` move. Imports needed:

```ts
import type { StormColors } from "../theme/colors.js";

export interface Line {
  text: string;
  color?: string;
  bold?: boolean;
  path?: string;
  collapsible?: boolean;
  isCollapsed?: boolean;
}

export function formatValue(
  data: unknown,
  indent: number,
  useColor: boolean,
  maxDepth: number,
  currentDepth: number,
  prefix: string,
  currentPath: string,
  collapsedPaths: Set<string>,
  colors: StormColors,
  visited: Set<object> = new Set(),
): Line[] { /* body unchanged */ }
```

- [ ] **Step 2: Replace inline declarations in `Pretty.tsx` with an import**

```ts
import { formatValue, type Line } from "../../utils/pretty-format.js";
```

Delete the moved declarations from `Pretty.tsx`.

- [ ] **Step 3: Run formatter tests**

```bash
bun test src/__tests__/pretty-format.test.ts
bun x tsc --noEmit
```

Expected: PASS, clean typecheck.

- [ ] **Step 4: Run full suite**

```bash
bun test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/pretty-format.ts src/components/data/Pretty.tsx
git commit -m "refactor(pretty): extract formatValue to src/utils/pretty-format.ts"
```

---

### Task 6: Test for `useDebouncedValue` hook

**Files:**
- Create: `src/__tests__/use-debounced-value.test.ts`

**Invoke skill:** `@test-driven-development`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { renderToString } from "../testing/index.js";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";

function Probe({ value, delay, sink }: { value: string; delay: number; sink: (v: string) => void }) {
  const debounced = useDebouncedValue(value, delay);
  React.useEffect(() => sink(debounced), [debounced, sink]);
  return React.createElement("tui-text", null, debounced);
}

describe("useDebouncedValue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns the initial value synchronously", () => {
    const sink = vi.fn();
    const out = renderToString(
      React.createElement(Probe, { value: "a", delay: 50, sink }),
      { width: 10, height: 1 },
    );
    expect(out).toContain("a");
  });

  it("debounces rapid updates to the trailing value", async () => {
    const sink = vi.fn();
    const { rerender } = (await import("../testing/index.js")).renderForTest(
      React.createElement(Probe, { value: "a", delay: 50, sink }),
      { width: 10, height: 1 },
    );
    rerender(React.createElement(Probe, { value: "b", delay: 50, sink }));
    rerender(React.createElement(Probe, { value: "c", delay: 50, sink }));
    vi.advanceTimersByTime(49);
    expect(sink).toHaveBeenLastCalledWith("a");
    vi.advanceTimersByTime(2);
    expect(sink).toHaveBeenLastCalledWith("c");
  });
});
```

- [ ] **Step 2: Run to verify it fails on missing module**

Run: `bun test src/__tests__/use-debounced-value.test.ts`
Expected: FAIL — `../hooks/useDebouncedValue.js` not found.

- [ ] **Step 3: Commit failing test**

```bash
git add src/__tests__/use-debounced-value.test.ts
git commit -m "test(hooks): add failing test for useDebouncedValue"
```

---

### Task 7: Implement `useDebouncedValue`

**Files:**
- Create: `src/hooks/useDebouncedValue.ts`
- Modify: `src/hooks/index.ts`

**Invoke skill:** `@typescript`

- [ ] **Step 1: Implement the hook using project conventions (`useCleanup` for teardown, `requestRender` for repaint)**

```ts
import { useRef, useState } from "react";
import { useCleanup } from "./useCleanup.js";
import { useTui } from "../context/TuiContext.js";

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSeenRef = useRef(value);
  const { requestRender } = useTui();

  if (lastSeenRef.current !== value) {
    lastSeenRef.current = value;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebounced(value);
      requestRender();
    }, delayMs);
  }

  useCleanup(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  });

  return debounced;
}
```

- [ ] **Step 2: Add the public export**

Append to `src/hooks/index.ts`:

```ts
export { useDebouncedValue } from "./useDebouncedValue.js";
```

- [ ] **Step 3: Run the focused test + typecheck**

```bash
bun test src/__tests__/use-debounced-value.test.ts
bun x tsc --noEmit
```

Expected: PASS, clean typecheck.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useDebouncedValue.ts src/hooks/index.ts
git commit -m "feat(hooks): add useDebouncedValue"
```

---

### Task 8: Test for `MarkdownEditor` component

**Files:**
- Create: `src/__tests__/markdown-editor.test.ts`

**Invoke skill:** `@test-driven-development`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { renderToString, renderForTest, fireEvent } from "../testing/index.js";
import { MarkdownEditor } from "../components/extras/MarkdownEditor.js";

describe("MarkdownEditor", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("renders editor on the left and preview on the right", () => {
    const out = renderToString(
      React.createElement(MarkdownEditor, {
        value: "# Hi\n",
        onChange: () => {},
        previewDelayMs: 50,
      }),
      { width: 80, height: 12 },
    );
    expect(out).toContain("Editor");
    expect(out).toContain("HI");
  });

  it("calls onChange and updates preview after debounce", () => {
    const onChange = vi.fn();
    const { stdin, rerender, lastFrame } = renderForTest(
      React.createElement(MarkdownEditor, {
        value: "",
        onChange,
        previewDelayMs: 50,
      }),
      { width: 80, height: 12 },
    );
    fireEvent.type(stdin, "# X");
    expect(onChange).toHaveBeenCalledWith("# X");
    rerender(
      React.createElement(MarkdownEditor, {
        value: "# X",
        onChange,
        previewDelayMs: 50,
      }),
    );
    vi.advanceTimersByTime(60);
    expect(lastFrame()).toContain("X");
  });

  it("toggles focus between editor and preview on Tab", () => {
    const { stdin, lastFrame } = renderForTest(
      React.createElement(MarkdownEditor, {
        value: "body",
        onChange: () => {},
        previewDelayMs: 0,
      }),
      { width: 80, height: 12 },
    );
    expect(lastFrame()).toContain("Editor");
    fireEvent.key(stdin, { key: "tab" });
    expect(lastFrame()).toContain("Preview");
  });
});
```

- [ ] **Step 2: Run to verify it fails on missing module**

Run: `bun test src/__tests__/markdown-editor.test.ts`
Expected: FAIL — `../components/extras/MarkdownEditor.js` not found.

- [ ] **Step 3: Commit failing test**

```bash
git add src/__tests__/markdown-editor.test.ts
git commit -m "test(components): add failing tests for MarkdownEditor"
```

---

### Task 9: Implement `MarkdownEditor`

**Files:**
- Create: `src/components/extras/MarkdownEditor.tsx`

**Invoke skill:** `@tui` for the layout split, `@typescript` for the component types.

- [ ] **Step 1: Implement the component**

```tsx
import React, { useRef, useCallback } from "react";
import { useColors } from "../../hooks/useColors.js";
import { usePersonality } from "../../core/personality.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { useInput } from "../../hooks/useInput.js";
import { useForceUpdate } from "../../hooks/useForceUpdate.js";
import { Editor } from "./Editor.js";
import { Markdown } from "./Markdown.js";
import { ScrollView } from "../core/ScrollView.js";
import { pickLayoutProps } from "../../styles/applyStyles.js";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
import type { KeyEvent } from "../../input/types.js";

export interface MarkdownEditorProps extends StormLayoutStyleProps {
  /** Markdown source text. Controlled. */
  value: string;
  /** Called on every keystroke. */
  onChange: (next: string) => void;
  /** Debounce in ms before re-parsing the preview. @default 120 */
  previewDelayMs?: number;
  /** Visible editor rows. @default 16 */
  rows?: number;
  /** Whether keyboard input is routed to this composite. @default true */
  isFocused?: boolean;
  /** Width of the preview pane in cells. Falls back to flex split. */
  previewWidth?: number;
  /** Editor pane title. @default "Editor" */
  editorTitle?: string;
  /** Preview pane title. @default "Preview" */
  previewTitle?: string;
}

type Pane = "editor" | "preview";

export const MarkdownEditor = React.memo(function MarkdownEditor(
  rawProps: MarkdownEditorProps,
): React.ReactElement {
  const colors = useColors();
  const personality = usePersonality();
  const props = usePluginProps("MarkdownEditor", rawProps);

  const {
    value,
    onChange,
    previewDelayMs = 120,
    rows = 16,
    isFocused = true,
    previewWidth,
    editorTitle = "Editor",
    previewTitle = "Preview",
    ...layoutProps
  } = props;

  const focusRef = useRef<Pane>("editor");
  const forceUpdate = useForceUpdate();
  const debouncedValue = useDebouncedValue(value, previewDelayMs);

  const handleInput = useCallback(
    (event: KeyEvent) => {
      if (event.key === "tab" && !event.shift) {
        focusRef.current = focusRef.current === "editor" ? "preview" : "editor";
        forceUpdate();
      }
    },
    [forceUpdate],
  );

  useInput(handleInput, { isActive: isFocused });

  const editorPane = React.createElement(
    "tui-box",
    { flexDirection: "column", flex: previewWidth ? undefined : 1, marginRight: 1 },
    React.createElement(Editor, {
      title: editorTitle,
      language: "markdown",
      rows,
      value,
      onChange,
      isFocused: isFocused && focusRef.current === "editor",
    }),
  );

  const previewPane = React.createElement(
    "tui-box",
    {
      flexDirection: "column",
      flex: previewWidth ? undefined : 1,
      ...(previewWidth !== undefined ? { width: previewWidth } : {}),
      borderStyle: personality.borders.panel,
      borderColor: colors.divider,
      paddingX: 1,
    },
    React.createElement(
      "tui-text",
      { color: colors.text.secondary, dim: true },
      previewTitle,
    ),
    React.createElement(
      ScrollView,
      { flex: 1, height: rows, overflow: "scroll" },
      React.createElement(Markdown, { content: debouncedValue }),
    ),
  );

  const outerProps: Record<string, unknown> = {
    flexDirection: "row",
    ...pickLayoutProps(layoutProps),
  };

  return React.createElement("tui-box", outerProps, editorPane, previewPane);
});
```

- [ ] **Step 2: Run the focused test + typecheck**

```bash
bun test src/__tests__/markdown-editor.test.ts
bun x tsc --noEmit
```

Expected: PASS, clean typecheck. If a test fails, fix the component (not the test) until green.

- [ ] **Step 3: Run full suite**

```bash
bun test
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/extras/MarkdownEditor.tsx
git commit -m "feat(components): add MarkdownEditor with debounced live preview"
```

---

### Task 10: Wire public exports + docs for `MarkdownEditor`

**Files:**
- Modify: `src/components/index.ts`
- Modify: `src/index.ts`
- Modify: `docs/components/content.md`
- Modify: `docs/features.md`
- Modify: `docs/hook-guide.md`

**Invoke skill:** `@docs-writing`

- [ ] **Step 1: Add the export to `src/components/index.ts`**

After the existing `MarkdownViewer` export line, append:

```ts
export { MarkdownEditor, type MarkdownEditorProps } from "./extras/MarkdownEditor.js";
```

- [ ] **Step 2: Add the same export to `src/index.ts`**

After the `MarkdownViewer` line (around line 231), append:

```ts
export { MarkdownEditor, type MarkdownEditorProps } from "./components/extras/MarkdownEditor.js";
```

- [ ] **Step 3: Add a `### MarkdownEditor` section to `docs/components/content.md`**

Insert after the `MarkdownViewer` section (currently ending around line 552):

```markdown
### MarkdownEditor

Pairs `Editor` (markdown source) with a live `Markdown` preview pane.
Re-parses on a debounce so fast typing does not thrash the renderer.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | -- | Markdown source (controlled) |
| `onChange` | `(next: string) => void` | -- | Called on every keystroke |
| `previewDelayMs` | `number` | `120` | Debounce before re-parsing preview |
| `rows` | `number` | `16` | Visible editor rows |
| `previewWidth` | `number` | -- | Preview width in cells; defaults to flex split |
| `editorTitle` | `string` | `"Editor"` | Editor pane title |
| `previewTitle` | `string` | `"Preview"` | Preview pane title |
| `isFocused` | `boolean` | `true` | Keyboard routing active |

Example:

```tsx
<MarkdownEditor
  value={text}
  onChange={setText}
  previewDelayMs={150}
  rows={20}
/>
```

Tab toggles focus between editor and preview panes.
```

- [ ] **Step 4: Add the row to `docs/features.md` components table**

After the `MarkdownViewer` row (line 218), insert:

```markdown
| `MarkdownEditor` | Component | `components/extras/MarkdownEditor.tsx` | Editor + live preview pair       | —    |
```

- [ ] **Step 5: Add a short `useDebouncedValue` entry to `docs/hook-guide.md`**

Add a section under the existing utility hooks:

```markdown
### `useDebouncedValue<T>(value, delayMs): T`

Returns the input value, but trailing-edge debounced. Use when downstream
work is expensive (re-parse, re-render large content) and the input
changes faster than the work can complete. Cleans up its timer through
`useCleanup`.
```

- [ ] **Step 6: Run typecheck + full suite**

```bash
bun x tsc --noEmit
bun test
```

Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/index.ts src/index.ts docs/components/content.md docs/features.md docs/hook-guide.md
git commit -m "docs(components): document MarkdownEditor and useDebouncedValue"
```

---

### Task 11: Add a runnable example

**Files:**
- Create: `examples/ui-terminal/showcase/markdown-editor.tsx`

**Invoke skill:** none

- [ ] **Step 1: Write the example**

```tsx
import React, { useState } from "react";
import { render, MarkdownEditor } from "reacterm";

const initial = `# Hello

Edit me on the **left** and watch the preview update on the right.

| col | val |
|-----|-----|
| a   | 1   |
| b   | 2   |
`;

function App() {
  const [text, setText] = useState(initial);
  return <MarkdownEditor value={text} onChange={setText} previewDelayMs={150} />;
}

render(<App />);
```

- [ ] **Step 2: Run it manually to verify**

Run: `npx tsx examples/ui-terminal/showcase/markdown-editor.tsx`
Expected: split layout boots, typing in the left pane updates the right pane after the debounce. Press Ctrl-C to exit.

- [ ] **Step 3: Run typecheck across the example**

```bash
bun x tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add examples/ui-terminal/showcase/markdown-editor.tsx
git commit -m "docs(examples): add markdown-editor showcase"
```

---

### Task 12 (final): Acceptance + Post-Implementation Review

**Files:**
- Modify: this plan file (append the review block)

**Invoke skill:** `@verification-before-completion`

- [ ] **Step 1: Re-read every Acceptance Criteria item below**

Hold the criteria in context.

- [ ] **Step 2: Run every acceptance command, fresh, in one batch**

```bash
bun x tsc --noEmit
bun test
bun test src/__tests__/markdown-parse.test.ts
bun test src/__tests__/markdown.test.ts
bun test src/__tests__/pretty-format.test.ts
bun test src/__tests__/use-debounced-value.test.ts
bun test src/__tests__/markdown-editor.test.ts
test ! -z "$(grep -E 'parseInline|parseBlocks' src/utils/markdown/parse.ts)"
test ! -z "$(grep -E 'renderBlock' src/utils/markdown/render-blocks.tsx)"
test ! -z "$(grep -E 'formatValue' src/utils/pretty-format.ts)"
test -z "$(grep -E 'function parseBlocks|function parseInline' src/components/extras/Markdown.tsx)"
test -z "$(grep -E 'function formatValue' src/components/data/Pretty.tsx)"
grep -q "MarkdownEditor" src/index.ts
grep -q "MarkdownEditor" src/components/index.ts
grep -q "useDebouncedValue" src/hooks/index.ts
test -f examples/ui-terminal/showcase/markdown-editor.tsx
```

For each: ✅ pass / ⚠ known-limit / ❌ fail.

- [ ] **Step 3: Resolve every ❌**

Fix or, after 2-3 different approaches, log under `Known Limitations`.

- [ ] **Step 4: Append the review block to this plan file**

Add three subsections at the bottom of this document:
- **Acceptance results** — paste verification output for each command.
- **Scope drift** — list every change beyond this plan. Justify or revert each.
- **Refactor proposals** — list noticed-but-not-executed improvements with trigger conditions.

- [ ] **Step 5: Surface limitations**

If `Known Limitations` is non-empty, summarise to the user: which acceptance items did not pass, what blocks them, suggested next step.

- [ ] **Step 6: Commit**

```bash
git add .warden/plans/2026-05-01-markdown-pretty-utils-and-editor-plan.md
git commit -m "docs(plan): post-implementation review for markdown/pretty split + editor"
```

---

## Acceptance Criteria

Mechanical checks. Every item must be runnable and produce a binary pass/fail.

- `bun x tsc --noEmit` exits 0.
- `bun test` exits 0.
- `bun test src/__tests__/markdown-parse.test.ts` exits 0 with all assertions green.
- `bun test src/__tests__/markdown.test.ts` exits 0 (component snapshot test passes).
- `bun test src/__tests__/pretty-format.test.ts` exits 0.
- `bun test src/__tests__/use-debounced-value.test.ts` exits 0.
- `bun test src/__tests__/markdown-editor.test.ts` exits 0.
- `src/utils/markdown/parse.ts` exists and exports `parseInline` and `parseBlocks`.
- `src/utils/markdown/render-blocks.tsx` exists and exports `renderBlock`.
- `src/utils/pretty-format.ts` exists and exports `formatValue`.
- `src/components/extras/Markdown.tsx` no longer contains `function parseBlocks` or `function parseInline`.
- `src/components/data/Pretty.tsx` no longer contains `function formatValue`.
- `src/index.ts` re-exports `MarkdownEditor` and `MarkdownEditorProps`.
- `src/components/index.ts` re-exports `MarkdownEditor` and `MarkdownEditorProps`.
- `src/hooks/index.ts` re-exports `useDebouncedValue`.
- `examples/ui-terminal/showcase/markdown-editor.tsx` exists and typechecks.
- `docs/components/content.md` contains a `### MarkdownEditor` section.
- `docs/features.md` contains a `MarkdownEditor` row in the components table.

## Known Limitations

None — every acceptance item passed ✅.

## Post-Implementation Review

### Acceptance results

| # | Check | Result |
|---|-------|--------|
| 1 | `bun x tsc --noEmit` | ✅ exit 0 |
| 2 | `bun test` | ✅ 811 pass / 0 fail (was 792 baseline; 19 new) |
| 3 | `bun test src/__tests__/markdown-parse.test.ts` | ✅ 8 pass |
| 4 | `bun test src/__tests__/markdown.test.ts` | ✅ 2 pass |
| 5 | `bun test src/__tests__/pretty-format.test.ts` | ✅ 4 pass |
| 6 | `bun test src/__tests__/use-debounced-value.test.ts` | ✅ 2 pass |
| 7 | `bun test src/__tests__/markdown-editor.test.ts` | ✅ 3 pass |
| 8 | `src/utils/markdown/parse.ts` exports `parseInline`, `parseBlocks` | ✅ |
| 9 | `src/utils/markdown/render-blocks.tsx` exports `renderBlock` | ✅ |
| 10 | `src/utils/pretty-format.ts` exports `formatValue` | ✅ |
| 11 | `Markdown.tsx` no longer contains `function parseBlocks/parseInline` | ✅ |
| 12 | `Pretty.tsx` no longer contains `function formatValue` | ✅ |
| 13 | `src/index.ts` re-exports `MarkdownEditor` | ✅ |
| 14 | `src/components/index.ts` re-exports `MarkdownEditor` | ✅ |
| 15 | `src/hooks/index.ts` re-exports `useDebouncedValue` | ✅ |
| 16 | example file exists + typechecks | ✅ |
| 17 | `docs/components/content.md` `### MarkdownEditor` | ✅ |
| 18 | `docs/features.md` `MarkdownEditor` row | ✅ |

### Scope drift

- **Added `dist/` rebuild commit.** Not in plan, but examples import `from "reacterm"` which resolves to `dist/` — examples typecheck failed against stale `dist/` lacking `MarkdownEditor`. Decision: keep, dist/ is tracked in this repo.
- **Added `useDebouncedValue` doc section in `hook-guide.md`.** Plan said "short entry" — delivered. No drift.

### Refactor proposals

- **Pre-existing dead `const colors = useColors()` in `Pretty.tsx:86` (`PrettyCompoundNode`).** Surfaced by TS hint after my edits, but pre-dated this work. Trigger: next time `Pretty.tsx` opens for any reason, drop the line.
- **Markdown.tsx file size dropped from 742 → 36 lines.** Confirms ROADMAP §C3 split target without renaming `extras/` → `composites/`. Trigger: if other large `extras/` files (`Form.tsx`, `CommandPalette.tsx`, `DiffView.tsx`) get touched, apply the same `utils/<feature>/parse.ts` + `utils/<feature>/render.tsx` pattern.
- **`useDebouncedValue` could replace inline timer code in `useGhostText.ts:66` and `useSearchFilter.ts:70`.** Trigger: when those hooks are touched next, swap to `useDebouncedValue` for consistency.
- **`MarkdownEditor` does not yet route Tab focus through `FocusGroup`.** Current implementation uses an internal `focusRef` + `useInput`. Trigger: when a consumer wants the editor pane to participate in app-level focus traversal, lift focus state to a `FocusGroup`.
