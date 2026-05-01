import { renderToString } from "../reconciler/render-to-string.js";
import { getByLabel, getByRole, getByTestId, getByText, getFocused, resolveClickTarget, } from "./queries.js";
export function renderDriver(element, options = {}) {
    return new TuiDriverImpl(element, options);
}
class TuiDriverImpl {
    element;
    width;
    height;
    inner;
    traceEntries = [];
    constructor(element, options) {
        this.element = element;
        this.width = options.width ?? 80;
        this.height = options.height ?? 24;
        this.inner = renderToString(element, { width: this.width, height: this.height });
    }
    get output() { return this.inner.output; }
    get lines() { return this.inner.lines; }
    get styledOutput() { return this.inner.styledOutput; }
    get metadata() { return this.inner.metadata; }
    press(key, options) {
        const repeat = options?.repeat ?? 1;
        for (let i = 0; i < repeat; i++) {
            this.inner.input.pressKey(normalizeKey(key), options);
            this.refresh();
            this.record("press", { key, options: { ...options, repeat: undefined } });
        }
        return this;
    }
    type(text) {
        for (const char of text) {
            this.inner.input.pressKey(char, { char });
            this.refresh();
        }
        this.record("type", { text });
        return this;
    }
    paste(text) {
        this.inner.input.paste(text);
        this.refresh();
        this.record("paste", { text });
        return this;
    }
    click(target, button = "left") {
        const point = resolveClickTarget(this.metadata, target);
        this.inner.input.click(point.x, point.y, button);
        this.refresh();
        this.record("click", { target, point, button });
        return this;
    }
    scroll(direction, target = { x: 0, y: 0 }) {
        const point = resolveClickTarget(this.metadata, target);
        this.inner.input.scroll(direction, point.x, point.y);
        this.refresh();
        this.record("scroll", { direction, target, point });
        return this;
    }
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.inner.unmount();
        this.inner = renderToString(this.element, { width, height });
        this.record("resize", { width, height });
        return this;
    }
    waitForText(text) {
        return this.expectText(text);
    }
    waitForNoText(text) {
        return this.expectNoText(text);
    }
    waitForIdle() {
        this.record("waitForIdle");
        return this;
    }
    waitForFrameChange(previousHash) {
        const expected = previousHash ?? this.frames().at(-2)?.screenHash;
        if (expected !== undefined && expected === this.metadata.screenHash) {
            throw new Error(`Expected frame to change from ${expected}, but it did not.\n\n${this.output}`);
        }
        this.record("waitForFrameChange", { previousHash: expected });
        return this;
    }
    expectText(text) {
        const ok = typeof text === "string" ? this.output.includes(text) : text.test(this.output);
        if (!ok)
            throw new Error(`Expected output to contain ${text}.\n\nActual output:\n${this.output}`);
        this.record("expectText", { text: String(text) });
        return this;
    }
    expectNoText(text) {
        const ok = typeof text === "string" ? !this.output.includes(text) : !text.test(this.output);
        if (!ok)
            throw new Error(`Expected output not to contain ${text}.\n\nActual output:\n${this.output}`);
        this.record("expectNoText", { text: String(text) });
        return this;
    }
    expectFocused(matcher) {
        const node = this.getFocused();
        if (!node)
            throw new Error(`Expected a focused semantic node.\n\nActual output:\n${this.output}`);
        if (matcher !== undefined) {
            const value = node.label ?? node.text;
            const ok = typeof matcher === "string" ? value.includes(matcher) : matcher.test(value);
            if (!ok)
                throw new Error(`Expected focused node to match ${matcher}, got "${value}".`);
        }
        this.record("expectFocused", { matcher: matcher === undefined ? undefined : String(matcher) });
        return this;
    }
    assertNoWarnings() {
        if (this.metadata.warnings.length > 0) {
            throw new Error(`Expected no warnings, got:\n${this.metadata.warnings.join("\n")}`);
        }
        this.record("assertNoWarnings");
        return this;
    }
    assertNoOverlaps() {
        const seen = new Map();
        for (const node of this.metadata.semanticNodes.filter((entry) => entry.focusId !== undefined)) {
            if (node.bounds.width <= 0 || node.bounds.height <= 0)
                continue;
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
    getByText(text) { return getByText(this.metadata, text); }
    getByRole(role, options) { return getByRole(this.metadata, role, options); }
    getByLabel(label) { return getByLabel(this.metadata, label); }
    getByTestId(testId) { return getByTestId(this.metadata, testId); }
    getFocused() { return getFocused(this.metadata); }
    frames() { return this.metadata.frames; }
    trace() { return [...this.traceEntries]; }
    unmount() {
        this.inner.unmount();
    }
    refresh() {
        this.inner = this.inner.rerender(this.element);
    }
    record(type, detail) {
        this.traceEntries.push({
            type,
            detail,
            frame: this.frames().at(-1)?.index ?? 0,
            screenHash: this.metadata.screenHash,
        });
    }
}
function normalizeKey(key) {
    if (key === "enter")
        return "return";
    if (key === "esc")
        return "escape";
    return key;
}
//# sourceMappingURL=driver.js.map