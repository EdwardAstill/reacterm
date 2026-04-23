/**
 * Wires mouse scroll to hit-tested ScrollViews, Tab/Shift+Tab to focus cycling,
 * and double Ctrl+C to force-exit. Registered once at app startup, disposed on unmount.
 */
export class InputWiring {
    input;
    screen;
    renderCtx;
    pluginManager;
    unsubScroll;
    unsubTab;
    unsubCtrlC;
    lastCtrlC = 0;
    constructor(input, screen, renderCtx, pluginManager) {
        this.input = input;
        this.screen = screen;
        this.renderCtx = renderCtx;
        this.pluginManager = pluginManager;
        // ── Scroll: 1:1 pass-through ────────────────────────────────────
        // Each event = 1 line. Speed matches finger speed.
        this.unsubScroll = input.onMouse((event) => {
            const processed = pluginManager.processMouse(event);
            if (!processed)
                return;
            if (processed.action === "press" && (processed.button === "left" || processed.button === "middle" || processed.button === "right")) {
                const target = renderCtx.focus.hitTestInput(processed.x, processed.y);
                if (target) {
                    if (target.clickFocus) {
                        renderCtx.focus.focus(target.id);
                    }
                    const localX = processed.x - target.bounds.x;
                    const localY = processed.y - target.bounds.y;
                    target.onMouse?.(processed, localX, localY);
                }
            }
            if (processed.button === "scroll-up" || processed.button === "scroll-down") {
                const target = renderCtx.focus.hitTestScroll(processed.x, processed.y);
                const delta = processed.button === "scroll-up" ? -1 : 1;
                if (processed.shift && target?.onHScroll) {
                    target.onHScroll(delta);
                }
                else if (target?.onScroll) {
                    target.onScroll(delta);
                }
            }
        });
        // Tab cycles focus
        this.unsubTab = input.onKey((event) => {
            const processed = pluginManager.processKey(event);
            if (!processed)
                return;
            if (processed.key === "tab") {
                if (processed.shift)
                    renderCtx.focus.cyclePrev();
                else
                    renderCtx.focus.cycleNext();
            }
        });
        // Double Ctrl+C force exits
        this.unsubCtrlC = input.onKey((event) => {
            if (event.key === "c" && event.ctrl) {
                const now = Date.now();
                if (now - this.lastCtrlC < 500) {
                    input.stop();
                    screen.stop();
                    process.exit(0);
                }
                this.lastCtrlC = now;
            }
        });
    }
    /** Unsubscribe all input handlers. */
    dispose() {
        this.unsubScroll();
        this.unsubTab();
        this.unsubCtrlC();
    }
}
//# sourceMappingURL=input-wiring.js.map