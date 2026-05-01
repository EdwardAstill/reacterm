import React from "react";
import { renderToString, type RenderToStringResult } from "../reconciler/render-to-string.js";
import type { MouseEvent } from "../input/types.js";
import type { TestFrame, TestMetadata, TestSemanticNode } from "./metadata.js";
import {
  getByLabel,
  getByRole,
  getByTestId,
  getByText,
  getFocused,
  resolveClickTarget,
  type ClickTarget,
  type TextMatcher,
} from "./queries.js";

export interface DriverOptions {
  width?: number;
  height?: number;
  artifactDir?: string;
}

export interface DriverTraceEntry {
  type: string;
  detail?: unknown;
  frame: number;
  screenHash: string;
}

export interface TuiDriver {
  readonly output: string;
  readonly lines: string[];
  readonly styledOutput: string;
  readonly metadata: TestMetadata;
  press(key: string, options?: { ctrl?: boolean; meta?: boolean; shift?: boolean; repeat?: number }): TuiDriver;
  type(text: string): TuiDriver;
  paste(text: string): TuiDriver;
  click(target: ClickTarget, button?: MouseEvent["button"]): TuiDriver;
  scroll(direction: "up" | "down", target?: ClickTarget): TuiDriver;
  resize(width: number, height: number): TuiDriver;
  waitForText(text: TextMatcher): TuiDriver;
  waitForNoText(text: TextMatcher): TuiDriver;
  waitForIdle(): TuiDriver;
  waitForFrameChange(previousHash?: string): TuiDriver;
  expectText(text: TextMatcher): TuiDriver;
  expectNoText(text: TextMatcher): TuiDriver;
  expectFocused(matcher?: TextMatcher): TuiDriver;
  assertNoWarnings(): TuiDriver;
  assertNoOverlaps(): TuiDriver;
  getByText(text: TextMatcher): TestSemanticNode;
  getByRole(role: string, options?: { name?: TextMatcher }): TestSemanticNode;
  getByLabel(label: TextMatcher): TestSemanticNode;
  getByTestId(testId: string): TestSemanticNode;
  getFocused(): TestSemanticNode | null;
  frames(): TestFrame[];
  trace(): DriverTraceEntry[];
  unmount(): void;
}

export function renderDriver(element: React.ReactElement, options: DriverOptions = {}): TuiDriver {
  return new TuiDriverImpl(element, options);
}

class TuiDriverImpl implements TuiDriver {
  private element: React.ReactElement;
  private width: number;
  private height: number;
  private inner: RenderToStringResult;
  private readonly traceEntries: DriverTraceEntry[] = [];

  constructor(element: React.ReactElement, options: DriverOptions) {
    this.element = element;
    this.width = options.width ?? 80;
    this.height = options.height ?? 24;
    this.inner = renderToString(element, { width: this.width, height: this.height });
  }

  get output(): string { return this.inner.output; }
  get lines(): string[] { return this.inner.lines; }
  get styledOutput(): string { return this.inner.styledOutput; }
  get metadata(): TestMetadata { return this.inner.metadata; }

  press(key: string, options?: { ctrl?: boolean; meta?: boolean; shift?: boolean; repeat?: number }): TuiDriver {
    const repeat = options?.repeat ?? 1;
    for (let i = 0; i < repeat; i++) {
      this.inner.input.pressKey(normalizeKey(key), options);
      this.refresh();
      this.record("press", { key, options: { ...options, repeat: undefined } });
    }
    return this;
  }

  type(text: string): TuiDriver {
    for (const char of text) {
      this.inner.input.pressKey(char, { char });
      this.refresh();
    }
    this.record("type", { text });
    return this;
  }

  paste(text: string): TuiDriver {
    this.inner.input.paste(text);
    this.refresh();
    this.record("paste", { text });
    return this;
  }

  click(target: ClickTarget, button: MouseEvent["button"] = "left"): TuiDriver {
    const point = resolveClickTarget(this.metadata, target);
    this.inner.input.click(point.x, point.y, button);
    this.refresh();
    this.record("click", { target, point, button });
    return this;
  }

  scroll(direction: "up" | "down", target: ClickTarget = { x: 0, y: 0 }): TuiDriver {
    const point = resolveClickTarget(this.metadata, target);
    this.inner.input.scroll(direction, point.x, point.y);
    this.refresh();
    this.record("scroll", { direction, target, point });
    return this;
  }

  resize(width: number, height: number): TuiDriver {
    this.width = width;
    this.height = height;
    this.inner.unmount();
    this.inner = renderToString(this.element, { width, height });
    this.record("resize", { width, height });
    return this;
  }

  waitForText(text: TextMatcher): TuiDriver {
    return this.expectText(text);
  }

  waitForNoText(text: TextMatcher): TuiDriver {
    return this.expectNoText(text);
  }

  waitForIdle(): TuiDriver {
    this.record("waitForIdle");
    return this;
  }

  waitForFrameChange(previousHash?: string): TuiDriver {
    const expected = previousHash ?? this.frames().at(-2)?.screenHash;
    if (expected !== undefined && expected === this.metadata.screenHash) {
      throw new Error(`Expected frame to change from ${expected}, but it did not.\n\n${this.output}`);
    }
    this.record("waitForFrameChange", { previousHash: expected });
    return this;
  }

  expectText(text: TextMatcher): TuiDriver {
    const ok = typeof text === "string" ? this.output.includes(text) : text.test(this.output);
    if (!ok) throw new Error(`Expected output to contain ${text}.\n\nActual output:\n${this.output}`);
    this.record("expectText", { text: String(text) });
    return this;
  }

  expectNoText(text: TextMatcher): TuiDriver {
    const ok = typeof text === "string" ? !this.output.includes(text) : !text.test(this.output);
    if (!ok) throw new Error(`Expected output not to contain ${text}.\n\nActual output:\n${this.output}`);
    this.record("expectNoText", { text: String(text) });
    return this;
  }

  expectFocused(matcher?: TextMatcher): TuiDriver {
    const node = this.getFocused();
    if (!node) throw new Error(`Expected a focused semantic node.\n\nActual output:\n${this.output}`);
    if (matcher !== undefined) {
      const value = node.label ?? node.text;
      const ok = typeof matcher === "string" ? value.includes(matcher) : matcher.test(value);
      if (!ok) throw new Error(`Expected focused node to match ${matcher}, got "${value}".`);
    }
    this.record("expectFocused", { matcher: matcher === undefined ? undefined : String(matcher) });
    return this;
  }

  assertNoWarnings(): TuiDriver {
    if (this.metadata.warnings.length > 0) {
      throw new Error(`Expected no warnings, got:\n${this.metadata.warnings.join("\n")}`);
    }
    this.record("assertNoWarnings");
    return this;
  }

  assertNoOverlaps(): TuiDriver {
    const seen = new Map<string, string>();
    for (const node of this.metadata.semanticNodes.filter((entry) => entry.focusId !== undefined)) {
      if (node.bounds.width <= 0 || node.bounds.height <= 0) continue;
      const key = `${node.bounds.x},${node.bounds.y},${node.bounds.width},${node.bounds.height}`;
      const prior = seen.get(key);
      if (prior !== undefined) {
        throw new Error(`Semantic nodes overlap at identical bounds: ${prior} and ${node.id}`);
      }
      seen.set(key, node.id);
    }
    this.record("assertNoOverlaps");
    return this;
  }

  getByText(text: TextMatcher): TestSemanticNode { return getByText(this.metadata, text); }
  getByRole(role: string, options?: { name?: TextMatcher }): TestSemanticNode { return getByRole(this.metadata, role, options); }
  getByLabel(label: TextMatcher): TestSemanticNode { return getByLabel(this.metadata, label); }
  getByTestId(testId: string): TestSemanticNode { return getByTestId(this.metadata, testId); }
  getFocused(): TestSemanticNode | null { return getFocused(this.metadata); }
  frames(): TestFrame[] { return this.metadata.frames; }
  trace(): DriverTraceEntry[] { return [...this.traceEntries]; }

  unmount(): void {
    this.inner.unmount();
  }

  private refresh(): void {
    this.inner = this.inner.rerender(this.element);
  }

  private record(type: string, detail?: unknown): void {
    this.traceEntries.push({
      type,
      detail,
      frame: this.frames().at(-1)?.index ?? 0,
      screenHash: this.metadata.screenHash,
    });
  }
}

function normalizeKey(key: string): string {
  if (key === "enter") return "return";
  if (key === "esc") return "escape";
  return key;
}
