/**
 * Storm TUI testing utilities.
 *
 * Provides renderForTest for component testing, renderDriver for app flows,
 * input simulation, assertion helpers, snapshots, scenario replay, explorer
 * runs, artifacts, and optional PTY smoke helpers.
 */
import * as fs from "fs";
import * as path from "path";
import { renderToString } from "../reconciler/render-to-string.js";
import { renderToSvg } from "./svg-renderer.js";
export { renderToSvg } from "./svg-renderer.js";
export { TestInputManager, TestInputManager as MockInputManager } from "./input-manager.js";
export * from "./metadata.js";
export * from "./queries.js";
export * from "./driver.js";
export * from "./artifacts.js";
export * from "./scenario.js";
export * from "./explorer.js";
export * from "./pty.js";
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
export function renderForTest(element, options) {
    const width = options?.width ?? 80;
    const height = options?.height ?? 24;
    const renderOpts = { width, height };
    let inner = renderToString(element, renderOpts);
    function refresh() {
        // Re-render the current element to pick up state changes triggered by events
        inner = inner.rerender(element);
    }
    const result = {
        get output() { return inner.output; },
        get lines() { return inner.lines; },
        get styledOutput() { return inner.styledOutput; },
        get metadata() { return inner.metadata; },
        width,
        height,
        fireKey(key, opts) {
            inner.input.pressKey(key, opts);
            refresh();
        },
        type(text) {
            inner.input.type(text);
            refresh();
        },
        pressEnter() {
            inner.input.pressEnter();
            refresh();
        },
        pressEscape() {
            inner.input.pressKey("escape");
            refresh();
        },
        pressTab() {
            inner.input.pressKey("tab");
            refresh();
        },
        pressUp() {
            inner.input.pressKey("up");
            refresh();
        },
        pressDown() {
            inner.input.pressKey("down");
            refresh();
        },
        pressLeft() {
            inner.input.pressKey("left");
            refresh();
        },
        pressRight() {
            inner.input.pressKey("right");
            refresh();
        },
        scroll(direction, x, y) {
            inner.input.scroll(direction, x, y);
            refresh();
        },
        click(x, y, button) {
            inner.input.click(x, y, button);
            refresh();
        },
        paste(text) {
            inner.input.paste(text);
            refresh();
        },
        rerender(el) {
            element = el;
            inner = inner.rerender(el);
        },
        getLine(lineNumber) {
            return inner.lines[lineNumber] ?? "";
        },
        hasText(text) {
            return inner.output.includes(text);
        },
        findText(pattern) {
            const matches = [];
            const globalPattern = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
            let match;
            while ((match = globalPattern.exec(inner.output)) !== null) {
                matches.push(match[0]);
            }
            return matches;
        },
        unmount() {
            inner.unmount();
        },
    };
    return result;
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
export function expectOutput(result) {
    return {
        toContainText(text) {
            if (!result.output.includes(text)) {
                throw new Error(`Expected output to contain "${text}" but it did not.\n\nActual output:\n${result.output}`);
            }
        },
        toNotContainText(text) {
            if (result.output.includes(text)) {
                throw new Error(`Expected output to NOT contain "${text}" but it did.\n\nActual output:\n${result.output}`);
            }
        },
        toHaveLineCount(count) {
            if (result.lines.length !== count) {
                throw new Error(`Expected ${count} lines but got ${result.lines.length}.\n\nLines:\n${result.lines.map((l, i) => `  ${i}: "${l}"`).join("\n")}`);
            }
        },
        toMatchSnapshot(name) {
            const { match, diff } = compareSnapshot(result.output, name);
            if (!match) {
                throw new Error(`Snapshot "${name}" mismatch.\n\n${diff ?? "No existing snapshot found. Call createSnapshot() first to establish the baseline."}`);
            }
        },
        lineAt(n) {
            const line = result.lines[n] ?? "";
            return {
                toContain(text) {
                    if (!line.includes(text)) {
                        throw new Error(`Expected line ${n} to contain "${text}" but it did not.\n\nLine ${n}: "${line}"`);
                    }
                },
                toEqual(text) {
                    if (line !== text) {
                        throw new Error(`Expected line ${n} to equal "${text}" but got "${line}".`);
                    }
                },
                toBeEmpty() {
                    if (line !== "") {
                        throw new Error(`Expected line ${n} to be empty but got "${line}".`);
                    }
                },
            };
        },
    };
}
/** In-memory snapshot store for test runs. */
const snapshotStore = new Map();
/**
 * Store a snapshot with the given name.
 * Returns the snapshot string for inspection.
 */
export function createSnapshot(output, name) {
    snapshotStore.set(name, output);
    return output;
}
/**
 * Compare output against a stored snapshot.
 * Returns match status and a human-readable diff on mismatch.
 */
export function compareSnapshot(output, name) {
    const stored = snapshotStore.get(name);
    if (stored === undefined) {
        return {
            match: false,
            diff: `No snapshot found with name "${name}". Use createSnapshot() to create one.`,
        };
    }
    if (stored === output) {
        return { match: true };
    }
    const expectedLines = stored.split("\n");
    const actualLines = output.split("\n");
    const maxLen = Math.max(expectedLines.length, actualLines.length);
    const diffLines = [];
    for (let i = 0; i < maxLen; i++) {
        const expected = expectedLines[i];
        const actual = actualLines[i];
        if (expected === actual) {
            diffLines.push(`  ${i}: "${expected ?? ""}"`);
        }
        else {
            if (expected !== undefined) {
                diffLines.push(`- ${i}: "${expected}"`);
            }
            if (actual !== undefined) {
                diffLines.push(`+ ${i}: "${actual}"`);
            }
        }
    }
    return {
        match: false,
        diff: `Expected (-)  vs  Actual (+):\n${diffLines.join("\n")}`,
    };
}
/**
 * Clear all stored snapshots. Useful in test teardown.
 */
export function clearSnapshots() {
    snapshotStore.clear();
}
/**
 * Save a snapshot to a file.
 * Creates parent directories if they do not exist.
 */
export function saveSnapshot(output, filePath) {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, output, "utf-8");
}
/**
 * Load and compare a snapshot from a file.
 * Returns match status, whether the snapshot is new, and a diff on mismatch.
 */
export function compareFileSnapshot(output, filePath) {
    if (!fs.existsSync(filePath)) {
        return { match: false, isNew: true, diff: `No snapshot file found at "${filePath}". Use saveSnapshot() to create one.` };
    }
    const stored = fs.readFileSync(filePath, "utf-8");
    if (stored === output) {
        return { match: true, isNew: false };
    }
    const expectedLines = stored.split("\n");
    const actualLines = output.split("\n");
    const maxLen = Math.max(expectedLines.length, actualLines.length);
    const diffLines = [];
    for (let i = 0; i < maxLen; i++) {
        const expected = expectedLines[i];
        const actual = actualLines[i];
        if (expected === actual) {
            diffLines.push(`  ${i}: "${expected ?? ""}"`);
        }
        else {
            if (expected !== undefined) {
                diffLines.push(`- ${i}: "${expected}"`);
            }
            if (actual !== undefined) {
                diffLines.push(`+ ${i}: "${actual}"`);
            }
        }
    }
    return {
        match: false,
        isNew: false,
        diff: `Expected (-)  vs  Actual (+):\n${diffLines.join("\n")}`,
    };
}
/**
 * Save an SVG snapshot to a file.
 * Renders the RenderResult to SVG and writes it to the given path.
 */
export function saveSvgSnapshot(result, filePath, options) {
    const svg = renderToSvg(result.lines, result.styledOutput, result.width, result.height, options);
    saveSnapshot(svg, filePath);
}
/**
 * Compare an SVG snapshot against a file.
 * Renders the RenderResult to SVG and compares against the stored file.
 */
export function compareSvgSnapshot(result, filePath, options) {
    const svg = renderToSvg(result.lines, result.styledOutput, result.width, result.height, options);
    return compareFileSnapshot(svg, filePath);
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
export function createStormMatchers() {
    return {
        toMatchStormSnapshot(received, snapshotName) {
            const result = received;
            const name = snapshotName;
            const { match, diff } = compareSnapshot(result.output, name);
            return {
                pass: match,
                message: () => match
                    ? `Expected output NOT to match snapshot "${name}", but it did.`
                    : `Snapshot "${name}" mismatch.\n\n${diff ?? "No existing snapshot found. Call createSnapshot() first."}`,
            };
        },
        toContainStormText(received, text) {
            const result = received;
            const searchText = text;
            const pass = result.output.includes(searchText);
            return {
                pass,
                message: () => pass
                    ? `Expected output NOT to contain "${searchText}", but it did.\n\nActual output:\n${result.output}`
                    : `Expected output to contain "${searchText}" but it did not.\n\nActual output:\n${result.output}`,
            };
        },
        toHaveStormLines(received, count) {
            const result = received;
            const expected = count;
            const pass = result.lines.length === expected;
            return {
                pass,
                message: () => pass
                    ? `Expected output NOT to have ${expected} lines, but it did.`
                    : `Expected ${expected} lines but got ${result.lines.length}.\n\nLines:\n${result.lines.map((l, i) => `  ${i}: "${l}"`).join("\n")}`,
            };
        },
    };
}
//# sourceMappingURL=index.js.map