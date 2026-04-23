/**
 * Storm TUI testing utilities.
 *
 * Provides fireEvent for simulating keyboard/mouse input,
 * enhanced renderToString for component testing, assertion helpers,
 * and snapshot utilities.
 */
import React from "react";
import type { KeyEvent, MouseEvent, PasteEvent } from "../input/types.js";
import { type SvgOptions } from "./svg-renderer.js";
export { renderToSvg, type SvgOptions } from "./svg-renderer.js";
/**
 * Create a mock InputManager that can receive simulated events.
 */
export declare class TestInputManager {
    private keyHandlers;
    private prioritizedKeyHandlers;
    private mouseHandlers;
    private pasteHandlers;
    onKey(handler: (e: KeyEvent) => void): () => void;
    /** Register a key handler with priority (mirrors InputManager). */
    onKeyPrioritized(handler: (e: KeyEvent) => void, priority: number): () => void;
    onMouse(handler: (e: MouseEvent) => void): () => void;
    onPaste(handler: (e: PasteEvent) => void): () => void;
    /** Simulate a key press */
    pressKey(key: string, options?: {
        ctrl?: boolean;
        shift?: boolean;
        meta?: boolean;
        char?: string;
    }): void;
    /** Simulate typing a string character by character */
    type(text: string): void;
    /** Simulate Enter key */
    pressEnter(): void;
    /** Simulate scroll */
    scroll(direction: "up" | "down", x?: number, y?: number): void;
    /** Simulate mouse click/press */
    click(x?: number, y?: number, button?: MouseEvent["button"]): void;
    /** Simulate paste event */
    paste(text: string): void;
    /** Release all handler references to prevent memory leaks. */
    dispose(): void;
    get isAttached(): boolean;
    start(): void;
    stop(): void;
}
export { TestInputManager as MockInputManager };
export interface RenderResult {
    /** Plain text output (no ANSI) */
    output: string;
    /** Output lines */
    lines: string[];
    /** ANSI-styled output */
    styledOutput: string;
    /** Width of render area */
    width: number;
    /** Height of render area */
    height: number;
    /** Fire a key event */
    fireKey: (key: string, options?: {
        ctrl?: boolean;
        meta?: boolean;
        shift?: boolean;
    }) => void;
    /** Type a string (fires individual key events) */
    type: (text: string) => void;
    /** Fire enter */
    pressEnter: () => void;
    /** Fire escape */
    pressEscape: () => void;
    /** Fire tab */
    pressTab: () => void;
    /** Fire arrow keys */
    pressUp: () => void;
    pressDown: () => void;
    pressLeft: () => void;
    pressRight: () => void;
    /** Fire mouse scroll */
    scroll: (direction: "up" | "down", x?: number, y?: number) => void;
    /** Fire mouse click */
    click: (x?: number, y?: number, button?: MouseEvent["button"]) => void;
    /** Fire paste event */
    paste: (text: string) => void;
    /** Re-render with new props */
    rerender: (element: React.ReactElement) => void;
    /** Get text at specific line */
    getLine: (lineNumber: number) => string;
    /** Check if output contains text */
    hasText: (text: string) => boolean;
    /** Get all text matching a pattern */
    findText: (pattern: RegExp) => string[];
    /** Unmount and cleanup */
    unmount: () => void;
}
/**
 * Render a React element for testing with convenience helpers.
 *
 * Wraps renderToString() with input simulation, text queries, and
 * mutable state that updates on rerender.
 *
 * @example
 * ```tsx
 * const result = renderForTest(<Text>Hello</Text>, { width: 40, height: 5 });
 * expect(result.hasText("Hello")).toBe(true);
 * result.pressEnter();
 * ```
 */
export declare function renderForTest(element: React.ReactElement, options?: {
    width?: number;
    height?: number;
}): RenderResult;
export interface LineAssertions {
    toContain(text: string): void;
    toEqual(text: string): void;
    toBeEmpty(): void;
}
export interface OutputAssertions {
    toContainText(text: string): void;
    toNotContainText(text: string): void;
    toHaveLineCount(count: number): void;
    toMatchSnapshot(name: string): void;
    lineAt(n: number): LineAssertions;
}
/**
 * Create fluent assertion helpers for a RenderResult.
 *
 * Throws descriptive errors on assertion failure, making test output
 * easy to diagnose without framework-specific matchers.
 *
 * @example
 * ```tsx
 * const result = renderForTest(<Text>hello</Text>);
 * expectOutput(result).toContainText("hello");
 * expectOutput(result).lineAt(0).toContain("hello");
 * ```
 */
export declare function expectOutput(result: RenderResult): OutputAssertions;
/**
 * Store a snapshot with the given name.
 * Returns the snapshot string for inspection.
 */
export declare function createSnapshot(output: string, name: string): string;
/**
 * Compare output against a stored snapshot.
 * Returns match status and a human-readable diff on mismatch.
 */
export declare function compareSnapshot(output: string, name: string): {
    match: boolean;
    diff?: string;
};
/**
 * Clear all stored snapshots. Useful in test teardown.
 */
export declare function clearSnapshots(): void;
/**
 * Save a snapshot to a file.
 * Creates parent directories if they do not exist.
 */
export declare function saveSnapshot(output: string, filePath: string): void;
/**
 * Load and compare a snapshot from a file.
 * Returns match status, whether the snapshot is new, and a diff on mismatch.
 */
export declare function compareFileSnapshot(output: string, filePath: string): {
    match: boolean;
    isNew: boolean;
    diff?: string;
};
/**
 * Save an SVG snapshot to a file.
 * Renders the RenderResult to SVG and writes it to the given path.
 */
export declare function saveSvgSnapshot(result: RenderResult, filePath: string, options?: SvgOptions): void;
/**
 * Compare an SVG snapshot against a file.
 * Renders the RenderResult to SVG and compares against the stored file.
 */
export declare function compareSvgSnapshot(result: RenderResult, filePath: string, options?: SvgOptions): {
    match: boolean;
    isNew: boolean;
    diff?: string;
};
interface MatcherResult {
    pass: boolean;
    message: () => string;
}
/**
 * Create custom matchers for jest/vitest.
 *
 * Usage with vitest:
 * ```ts
 * import { createStormMatchers } from "reacterm";
 * expect.extend(createStormMatchers());
 * ```
 *
 * Provided matchers:
 * - `toMatchStormSnapshot(result, snapshotName)` — compare against in-memory snapshot
 * - `toContainStormText(result, text)` — check if output contains text
 * - `toHaveStormLines(result, count)` — check line count
 */
export declare function createStormMatchers(): Record<string, (...args: unknown[]) => MatcherResult>;
//# sourceMappingURL=index.d.ts.map