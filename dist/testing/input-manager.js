/**
 * Create a mock InputManager that can receive simulated events.
 */
export class TestInputManager {
    keyHandlers = new Set();
    prioritizedKeyHandlers = new Set();
    mouseHandlers = new Set();
    pasteHandlers = new Set();
    /**
     * Count of prioritized handlers that ran for the most recent pressKey call
     * without anyone consuming. Mirrors the production manager's warning logic
     * so tests can assert the "multiple isFocused" warning would or would not fire.
     */
    lastUnconsumedCountAtMax = 0;
    onKey(handler) {
        this.keyHandlers.add(handler);
        return () => { this.keyHandlers.delete(handler); };
    }
    /** Register a key handler with priority (mirrors InputManager). */
    onKeyPrioritized(handler, priority) {
        const entry = { handler, priority };
        this.prioritizedKeyHandlers.add(entry);
        return () => { this.prioritizedKeyHandlers.delete(entry); };
    }
    onMouse(handler) {
        this.mouseHandlers.add(handler);
        return () => { this.mouseHandlers.delete(handler); };
    }
    onPaste(handler) {
        this.pasteHandlers.add(handler);
        return () => { this.pasteHandlers.delete(handler); };
    }
    /** Simulate a key press */
    pressKey(key, options) {
        const event = {
            key,
            char: options?.char ?? (key.length === 1 ? key : ""),
            raw: key,
            ctrl: options?.ctrl ?? false,
            shift: options?.shift ?? false,
            meta: options?.meta ?? false,
        };
        this.lastUnconsumedCountAtMax = 0;
        if (this.prioritizedKeyHandlers.size > 0) {
            let maxPriority = -Infinity;
            for (const entry of this.prioritizedKeyHandlers) {
                if (entry.priority > maxPriority)
                    maxPriority = entry.priority;
            }
            let countAtMax = 0;
            for (const entry of this.prioritizedKeyHandlers) {
                if (entry.priority !== maxPriority)
                    continue;
                countAtMax++;
                entry.handler(event);
                if (event.consumed)
                    break;
            }
            if (!event.consumed)
                this.lastUnconsumedCountAtMax = countAtMax;
            if (event.consumed)
                return;
        }
        for (const h of this.keyHandlers) {
            h(event);
            if (event.consumed)
                return;
        }
    }
    /** Simulate typing a string character by character */
    type(text) {
        for (const char of text) {
            this.pressKey(char, { char });
        }
    }
    /** Simulate Enter key */
    pressEnter() {
        this.pressKey("return");
    }
    /** Simulate scroll */
    scroll(direction, x = 0, y = 0) {
        const event = {
            button: direction === "up" ? "scroll-up" : "scroll-down",
            action: "press",
            x, y,
            shift: false,
            ctrl: false,
            meta: false,
            raw: "",
        };
        for (const h of this.mouseHandlers)
            h(event);
    }
    /** Simulate mouse click/press */
    click(x = 0, y = 0, button = "left") {
        const event = {
            button,
            action: "press",
            x,
            y,
            shift: false,
            ctrl: false,
            meta: false,
            raw: "",
        };
        for (const h of this.mouseHandlers)
            h(event);
    }
    /** Simulate paste event */
    paste(text) {
        const event = { text };
        for (const h of this.pasteHandlers)
            h(event);
    }
    /** Release all handler references to prevent memory leaks. */
    dispose() {
        this.keyHandlers.clear();
        this.prioritizedKeyHandlers.clear();
        this.mouseHandlers.clear();
        this.pasteHandlers.clear();
    }
    get isAttached() { return true; }
    start() { }
    stop() { }
}
export { TestInputManager as MockInputManager };
//# sourceMappingURL=input-manager.js.map