import React from "react";
import Reconciler from "react-reconciler";
import { hostConfig } from "./host.js";
import { createRoot } from "./types.js";
import { paint } from "./renderer.js";
import { RenderContext } from "../core/render-context.js";
import { ScreenBuffer } from "../core/buffer.js";
import { DEFAULT_COLOR, Attr } from "../core/types.js";
import { fullSgr, RESET } from "../core/ansi.js";
import { TuiProvider } from "../context/TuiContext.js";
import { TestInputManager } from "../testing/index.js";
import { PluginManager } from "../core/plugin.js";
import { InputWiring } from "./input-wiring.js";
export const TuiReconciler = Reconciler(hostConfig);
export function syncContainerUpdate(element, container) {
    const reconciler = TuiReconciler; // React private API
    try {
        if (typeof reconciler.updateContainerSync === "function") {
            reconciler.updateContainerSync(element, container, null, null);
        }
        else {
            TuiReconciler.updateContainer(element, container, null, null);
        }
        if (typeof reconciler.flushSyncWork === "function") {
            reconciler.flushSyncWork();
        }
    }
    catch {
        // Fallback to public API if private APIs are removed/changed
        TuiReconciler.updateContainer(element, container, null, null);
    }
}
/** Synchronous. No terminal needed. Same reconciler + layout as render(), but paints to a string buffer. */
export function renderToString(element, options) {
    const width = options?.columns ?? options?.width ?? 80;
    const height = options?.rows ?? options?.height ?? 24;
    const renderCtx = new RenderContext();
    const testInput = new TestInputManager();
    const pluginManager = new PluginManager();
    const screen = {
        width,
        height,
        stdout: process.stdout,
        stdin: process.stdin,
        write: () => { },
        start: () => { },
        stop: () => { },
        flush: () => { },
        getBuffer: () => new ScreenBuffer(width, height),
        createBuffer: () => new ScreenBuffer(width, height),
        invalidate: () => { },
        setDebugRainbow: () => { },
        setCursor: () => { },
        setCursorVisible: () => { },
        onResizeEvent: () => () => { },
        isActive: false,
    };
    const mockContext = {
        screen,
        input: testInput,
        focus: renderCtx.focus,
        renderContext: renderCtx,
        exit: () => { },
        requestRender: () => { },
        flushSync: (fn) => { fn(); },
        clear: () => { },
        commitText: () => { },
    };
    let currentElement = element;
    const errors = [];
    const inputWiring = new InputWiring(testInput, screen, renderCtx, pluginManager);
    // Create root — onCommit is a no-op since we paint synchronously
    const root = createRoot(() => {
        renderCtx.invalidateLayout();
    });
    const container = TuiReconciler.createContainer(root, 0, null, false, null, "", (error) => {
        errors.push(error);
    }, null);
    function doRender(el) {
        currentElement = el;
        const wrapped = React.createElement(TuiProvider, { value: mockContext }, el);
        // Synchronously update the React tree — must use updateContainerSync +
        // flushSyncWork to ensure React processes ALL state updates before returning.
        // Plain updateContainer queues the update async, causing paint to see an empty tree.
        renderCtx.focus.tickRenderCycle();
        syncContainerUpdate(wrapped, container);
        // Throw if any errors were collected during rendering
        if (errors.length > 0) {
            const err = errors[0];
            errors.length = 0;
            throw err;
        }
        // Force layout invalidation and paint
        renderCtx.invalidateLayout();
        const result = paint(root, width, height, renderCtx);
        const plainLines = bufferToPlainLines(result.buffer);
        const styledLines = bufferToStyledLines(result.buffer);
        // Trim trailing empty lines for cleaner output
        const trimmedPlain = trimTrailingEmptyLines(plainLines);
        const trimmedStyled = trimTrailingEmptyLines(styledLines);
        return {
            output: trimmedPlain.join("\n"),
            styledOutput: trimmedStyled.join("\n"),
            lines: trimmedPlain,
            unmount,
            rerender: (newElement) => doRender(newElement),
            input: testInput,
        };
    }
    function unmount() {
        // Unmount React tree
        TuiReconciler.updateContainer(null, container, null, null);
        // Release the root's children so the entire element tree can be GC'd
        root.children.length = 0;
        root.onCommit = () => { };
        renderCtx.dispose();
        inputWiring.dispose();
        // Release all input handler references
        testInput.dispose();
        // Break closure references so nothing retains the container/root/context
        currentElement = null;
        errors.length = 0;
    }
    return doRender(element);
}
/**
 * Convert a ScreenBuffer to plain text lines (no ANSI codes).
 * Each line is right-trimmed to remove trailing spaces.
 */
function bufferToPlainLines(buffer) {
    const lines = [];
    for (let y = 0; y < buffer.height; y++) {
        let line = "";
        for (let x = 0; x < buffer.width; x++) {
            const ch = buffer.getChar(x, y);
            if (ch === "\0")
                continue;
            line += ch;
        }
        lines.push(line.replace(/\s+$/, ""));
    }
    return lines;
}
/**
 * Convert a ScreenBuffer to styled text lines (with ANSI escape codes).
 * Each line is right-trimmed to remove trailing default-styled spaces.
 */
function bufferToStyledLines(buffer) {
    const lines = [];
    for (let y = 0; y < buffer.height; y++) {
        let lastNonDefault = -1;
        for (let x = buffer.width - 1; x >= 0; x--) {
            if (buffer.getChar(x, y) !== " " || buffer.getFg(x, y) !== DEFAULT_COLOR || buffer.getBg(x, y) !== DEFAULT_COLOR || buffer.getAttrs(x, y) !== Attr.NONE) {
                lastNonDefault = x;
                break;
            }
        }
        if (lastNonDefault < 0) {
            lines.push("");
            continue;
        }
        let line = "";
        let curFg = DEFAULT_COLOR;
        let curBg = DEFAULT_COLOR;
        let curAttrs = Attr.NONE;
        for (let x = 0; x <= lastNonDefault; x++) {
            const cFg = buffer.getFg(x, y);
            const cBg = buffer.getBg(x, y);
            const cAttrs = buffer.getAttrs(x, y);
            if (cFg !== curFg || cBg !== curBg || cAttrs !== curAttrs) {
                line += fullSgr(cFg, cBg, cAttrs);
                curFg = cFg;
                curBg = cBg;
                curAttrs = cAttrs;
            }
            const ch = buffer.getChar(x, y);
            if (ch !== "\0")
                line += ch;
        }
        if (curFg !== DEFAULT_COLOR || curBg !== DEFAULT_COLOR || curAttrs !== Attr.NONE) {
            line += RESET;
        }
        lines.push(line);
    }
    return lines;
}
/** Remove trailing empty strings from an array of lines. */
function trimTrailingEmptyLines(lines) {
    let end = lines.length;
    while (end > 0 && lines[end - 1] === "") {
        end--;
    }
    return lines.slice(0, end);
}
//# sourceMappingURL=render-to-string.js.map