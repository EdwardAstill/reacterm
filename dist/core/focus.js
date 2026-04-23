/**
 * Focus & hit-test system.
 *
 * Manages which component receives keyboard events. Tracks layout
 * bounds of all interactive elements for mouse hit-testing.
 *
 * Key routing rules:
 * - Printable chars, backspace, delete, arrows, home/end -> focused input
 * - Shift+arrows, PgUp/PgDown -> ScrollView under mouse cursor (or focused)
 * - Ctrl+key combos -> global handlers (always fire)
 * - Tab -> cycles focus (respects tabIndex order and focus groups)
 * - Mouse scroll -> hit-tested ScrollView
 *
 * Focus groups:
 * - Components can belong to a named group via `groupId`
 * - `trapFocus(groupId)` restricts Tab cycling to that group (for modals/dialogs)
 * - `releaseFocus()` removes the trap and restores normal cycling
 * - Trapping is stackable — nested traps restore the previous trap on release
 *
 * Tab order:
 * - Each entry can specify a numeric `tabIndex` (default: registration order)
 * - Within a group (or globally), entries are sorted by tabIndex ascending
 * - Entries with equal tabIndex preserve registration order
 */
/** Keyboard focus routing, Tab cycling (with tabIndex + groups), and mouse hit-testing for ScrollViews. */
export class FocusManager {
    entries = new Map();
    order = [];
    focusedId = null;
    focusIndex = -1;
    listeners = new Set();
    focusChangeListeners = new Set();
    enabled = true;
    scopeStack = [];
    /** Stack of trapped focus group IDs. The top is the active trap. */
    trapStack = [];
    /** Auto-increment counter for registration-order tiebreaking */
    registrationCounter = 0;
    /** Map from entry ID to registration order (for stable sort tiebreaking) */
    registrationOrder = new Map();
    /** Stack of element IDs to restore focus to when a trap is released. */
    _focusRestoreStack = [];
    /** Focus ring visual mode — components query this via getFocusRingStyle(). */
    _focusRingMode = "prefix";
    /** Render-cycle counter — incremented on each tickRenderCycle() call. */
    _renderCycle = 0;
    /** The render cycle in which focus() was last called. */
    _lastFocusCycle = -1;
    /** Whether a double-focus warning was already emitted for the current cycle. */
    _warnedThisCycle = false;
    /**
     * The ScrollView that currently owns keyboard scroll events.
     * Updated when mouse scroll hits a ScrollView (via hitTestScroll) or
     * when there is only one ScrollView registered.
     * ScrollView keyboard handlers check this before processing events.
     */
    _activeScrollId = null;
    register(entry) {
        if (!this.entries.has(entry.id)) {
            this.order.push(entry.id);
            this.registrationOrder.set(entry.id, this.registrationCounter++);
        }
        // Assign current scope if one is active
        const currentScope = this.scopeStack.length > 0
            ? this.scopeStack[this.scopeStack.length - 1]
            : undefined;
        if (currentScope !== undefined && entry.scopeId === undefined) {
            entry.scopeId = currentScope;
        }
        this.entries.set(entry.id, entry);
        // Auto-focus first input
        if (!this.focusedId && entry.type === "input") {
            this.focusedId = entry.id;
            this.notify();
            this.notifyFocusChange(entry.id, null);
        }
    }
    unregister(id) {
        this.entries.delete(id);
        this.order = this.order.filter((oid) => oid !== id);
        this.registrationOrder.delete(id);
        if (this._activeScrollId === id) {
            this._activeScrollId = null;
        }
        if (this.focusedId === id) {
            const previousId = id;
            // Focus next input
            this.focusedId = this.order.find((oid) => this.entries.get(oid)?.type === "input") ?? null;
            this.notify();
            this.notifyFocusChange(this.focusedId, previousId);
        }
    }
    focus(id) {
        if (!this.enabled)
            return;
        if (this.entries.has(id) && this.focusedId !== id) {
            // Detect multiple focus() calls in the same render cycle (dev warning)
            if (this._lastFocusCycle === this._renderCycle && !this._warnedThisCycle) {
                this._warnedThisCycle = true;
                process.stderr.write(`[storm] Warning: Multiple elements have isFocused={true}. Only '${id}' will be focused. Set isFocused={false} on others.\n`);
            }
            this._lastFocusCycle = this._renderCycle;
            const previousId = this.focusedId;
            this.focusedId = id;
            // Keep focusIndex in sync for O(1) cycling
            const inputs = this.sortedInputs();
            const idx = inputs.indexOf(id);
            if (idx >= 0)
                this.focusIndex = idx;
            this.notify();
            this.notifyFocusChange(id, previousId);
        }
    }
    cycleNext() {
        if (!this.enabled)
            return;
        const inputs = this.sortedInputs();
        if (inputs.length === 0)
            return;
        const previousId = this.focusedId;
        this.focusIndex = (this.focusIndex + 1) % inputs.length;
        this.focusedId = inputs[this.focusIndex];
        this.notify();
        if (this.focusedId !== previousId) {
            this.notifyFocusChange(this.focusedId, previousId);
        }
    }
    cyclePrev() {
        if (!this.enabled)
            return;
        const inputs = this.sortedInputs();
        if (inputs.length === 0)
            return;
        const previousId = this.focusedId;
        this.focusIndex = (this.focusIndex - 1 + inputs.length) % inputs.length;
        this.focusedId = inputs[this.focusIndex];
        this.notify();
        if (this.focusedId !== previousId) {
            this.notifyFocusChange(this.focusedId, previousId);
        }
    }
    /**
     * Trap focus within a group. Tab cycling will only visit entries
     * belonging to the specified groupId. Traps are stackable — calling
     * trapFocus again pushes a new trap, and releaseFocus pops it.
     *
     * When a trap is activated, focus moves to the first input in the group
     * if the currently focused element is outside it.
     */
    trapFocus(groupId) {
        this._focusRestoreStack.push(this.focusedId ?? "");
        this.trapStack.push(groupId);
        // If current focus is not in the trapped group, move to first input in group
        const inputs = this.sortedInputs();
        if (inputs.length > 0 && (this.focusedId == null || !inputs.includes(this.focusedId))) {
            const previousId = this.focusedId;
            this.focusedId = inputs[0];
            this.focusIndex = 0;
            this.notify();
            this.notifyFocusChange(this.focusedId, previousId);
        }
    }
    /**
     * Release the current focus trap. If there are nested traps, the previous
     * trap becomes active. If the focused entry is not in the restored scope,
     * focus moves to the first eligible input.
     */
    releaseFocus() {
        if (this.trapStack.length === 0)
            return;
        this.trapStack.pop();
        // Restore focus to the element that was focused before the trap
        const savedId = this._focusRestoreStack.pop() ?? "";
        const previousId = this.focusedId;
        if (savedId && this.entries.has(savedId)) {
            // Saved element still exists — restore to it
            this.focusedId = savedId;
            const inputs = this.sortedInputs();
            const idx = inputs.indexOf(savedId);
            if (idx >= 0)
                this.focusIndex = idx;
            this.notify();
            if (this.focusedId !== previousId) {
                this.notifyFocusChange(this.focusedId, previousId);
            }
        }
        else {
            // Saved element no longer exists — fall back to first focusable
            const inputs = this.sortedInputs();
            if (inputs.length > 0) {
                this.focusedId = inputs[0];
                this.focusIndex = 0;
                this.notify();
                if (this.focusedId !== previousId) {
                    this.notifyFocusChange(this.focusedId, previousId);
                }
            }
        }
    }
    /**
     * Push a focus scope. After this call, newly registered entries belong to
     * this scope and Tab cycling is restricted to entries within it.
     */
    pushScope(scopeId) {
        this.scopeStack.push(scopeId);
    }
    /**
     * Pop a focus scope. Removes the scope from the stack and restores
     * previous cycling behavior. If the currently focused entry belonged
     * to the removed scope, focus moves to the first input in the new
     * active scope (or any input if no scope remains).
     */
    popScope(scopeId) {
        const idx = this.scopeStack.lastIndexOf(scopeId);
        if (idx >= 0) {
            this.scopeStack.splice(idx, 1);
        }
        // If the focused entry was in the removed scope, re-focus
        if (this.focusedId) {
            const entry = this.entries.get(this.focusedId);
            if (entry?.scopeId === scopeId) {
                const inputs = this.sortedInputs();
                const previousId = this.focusedId;
                this.focusedId = inputs.length > 0 ? inputs[0] : null;
                this.notify();
                this.notifyFocusChange(this.focusedId, previousId);
            }
        }
    }
    /**
     * Return the input IDs eligible for cycling, sorted by tabIndex.
     *
     * Respects (in priority order):
     * 1. Active focus trap (trapStack top) — only entries in that group
     * 2. Active scope (scopeStack top) — only entries in that scope
     * 3. All inputs (no trap, no scope)
     *
     * Within the eligible set, entries are sorted by tabIndex ascending,
     * with registration order as tiebreaker.
     */
    sortedInputs() {
        const activeGroup = this.trapStack.length > 0
            ? this.trapStack[this.trapStack.length - 1]
            : undefined;
        const currentScope = this.scopeStack.length > 0
            ? this.scopeStack[this.scopeStack.length - 1]
            : undefined;
        const eligible = this.order.filter((id) => {
            const e = this.entries.get(id);
            if (!e || e.type !== "input")
                return false;
            if (e.disabled)
                return false;
            // Focus trap takes priority
            if (activeGroup !== undefined)
                return e.groupId === activeGroup;
            // Then scope
            if (currentScope !== undefined)
                return e.scopeId === currentScope;
            return true;
        });
        // Sort by tabIndex (undefined treated as Infinity to go last), then registration order
        eligible.sort((a, b) => {
            const ea = this.entries.get(a);
            const eb = this.entries.get(b);
            const ta = ea.tabIndex ?? Infinity;
            const tb = eb.tabIndex ?? Infinity;
            if (ta !== tb)
                return ta - tb;
            return (this.registrationOrder.get(a) ?? 0) - (this.registrationOrder.get(b) ?? 0);
        });
        return eligible;
    }
    enableFocus() {
        this.enabled = true;
    }
    disableFocus() {
        this.enabled = false;
    }
    get isFocusEnabled() {
        return this.enabled;
    }
    isFocused(id) {
        return this.focusedId === id;
    }
    get focused() {
        return this.focusedId;
    }
    getFocusedEntry() {
        return this.focusedId ? this.entries.get(this.focusedId) : undefined;
    }
    get isTrapped() {
        return this.trapStack.length > 0;
    }
    get activeGroup() {
        return this.trapStack.length > 0
            ? this.trapStack[this.trapStack.length - 1]
            : null;
    }
    /** Hit-test: find the ScrollView containing (x, y).
     *  Also updates activeScrollId so keyboard scroll routes to this ScrollView. */
    hitTestScroll(x, y) {
        for (let i = this.order.length - 1; i >= 0; i--) {
            const entry = this.entries.get(this.order[i]);
            if (!entry || entry.type !== "scroll")
                continue;
            const b = entry.bounds;
            if (x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height) {
                this._activeScrollId = entry.id;
                return entry;
            }
        }
        // Fallback: first scroll view
        for (const id of this.order) {
            const entry = this.entries.get(id);
            if (entry?.type === "scroll") {
                this._activeScrollId = entry.id;
                return entry;
            }
        }
        return undefined;
    }
    hitTestInput(x, y) {
        for (let i = this.order.length - 1; i >= 0; i--) {
            const entry = this.entries.get(this.order[i]);
            if (!entry || entry.type !== "input")
                continue;
            const b = entry.bounds;
            if (x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height) {
                return entry;
            }
        }
        return undefined;
    }
    /**
     * The ID of the ScrollView that should receive keyboard scroll events.
     * Returns the explicitly activated one, or auto-selects the sole ScrollView
     * if only one exists.
     */
    get activeScrollId() {
        // If the tracked ID was unregistered, clear it
        if (this._activeScrollId && !this.entries.has(this._activeScrollId)) {
            this._activeScrollId = null;
        }
        // If set, use it
        if (this._activeScrollId)
            return this._activeScrollId;
        // Auto-select if there's exactly one scroll view
        let sole = null;
        for (const id of this.order) {
            const entry = this.entries.get(id);
            if (entry?.type === "scroll") {
                if (sole !== null)
                    return null; // more than one — no auto-select
                sole = id;
            }
        }
        return sole;
    }
    setActiveScroll(id) {
        this._activeScrollId = id;
    }
    updateBounds(id, x, y, width, height) {
        const entry = this.entries.get(id);
        if (entry) {
            entry.bounds.x = x;
            entry.bounds.y = y;
            entry.bounds.width = width;
            entry.bounds.height = height;
        }
    }
    onChange(fn) {
        this.listeners.add(fn);
        return () => { this.listeners.delete(fn); };
    }
    /**
     * Subscribe to focus changes with both new and previous focused IDs.
     * Returns an unsubscribe function.
     */
    onFocusChange(fn) {
        this.focusChangeListeners.add(fn);
        return () => { this.focusChangeListeners.delete(fn); };
    }
    // ── Tab key routing ────────────────────────────────────────────
    /**
     * Handle Tab/Shift+Tab key press. Cycles focus to the next or previous
     * enabled input in tab order. Wraps around at the boundaries.
     * Disabled entries are skipped automatically (sortedInputs filters them).
     */
    handleTabKey(shift) {
        if (shift) {
            this.cyclePrev();
        }
        else {
            this.cycleNext();
        }
    }
    // ── Focus ring ────────────────────────────────────────────────
    /**
     * Returns a visual indicator style for the given element.
     * Components can query this to decide how to render a focus ring.
     * Returns null if the element is not focused or the ring is disabled.
     */
    getFocusRingStyle(id) {
        if (this.focusedId !== id)
            return null;
        switch (this._focusRingMode) {
            case "border":
                return { borderColor: "blue" };
            case "prefix":
                return { prefix: "\u25B8 " }; // "▸ "
            case "none":
                return null;
        }
    }
    /**
     * Set the focus ring visual mode.
     * - "border": returns borderColor for styled borders
     * - "prefix": returns a prefix string ("▸ ") to prepend to focused text
     * - "none": disables focus ring (getFocusRingStyle always returns null)
     */
    setFocusRingStyle(mode) {
        this._focusRingMode = mode;
    }
    get focusRingMode() {
        return this._focusRingMode;
    }
    // ── Render cycle tracking (for double-focus warning) ──────────
    /**
     * Increment the render cycle counter. Call this once per paint/render cycle
     * so the double-focus warning can detect multiple focus() calls in the same frame.
     */
    tickRenderCycle() {
        this._renderCycle++;
        this._warnedThisCycle = false;
    }
    notify() {
        for (const fn of this.listeners)
            fn();
    }
    notifyFocusChange(newId, previousId) {
        for (const fn of this.focusChangeListeners)
            fn(newId, previousId);
    }
}
//# sourceMappingURL=focus.js.map