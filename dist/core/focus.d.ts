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
export interface FocusableEntry {
    id: string;
    type: "input" | "scroll";
    /** Screen bounds from last paint — mutable, renderer writes here */
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    /** Whether mouse press should also move keyboard focus here. */
    clickFocus?: boolean;
    /** Optional mouse callback with event-local coordinates. */
    onMouse?: (event: import("../input/types.js").MouseEvent, localX: number, localY: number) => void;
    /** For scroll views: imperative vertical scroll callback */
    onScroll?: (delta: number) => void;
    /** For scroll views: imperative horizontal scroll callback */
    onHScroll?: (delta: number) => void;
    /** Whether this scroll view currently has vertical overflow. */
    canScrollVertically?: () => boolean;
    /** Whether this scroll view currently has horizontal overflow. */
    canScrollHorizontally?: () => boolean;
    /** Scope this entry belongs to (set when pushed inside a scope) */
    scopeId?: string;
    /** Numeric tab order — lower values receive focus first. Default: registration order. */
    tabIndex?: number;
    /** Focus group this entry belongs to. */
    groupId?: string;
    /** When true, this entry is skipped by Tab cycling. */
    disabled?: boolean;
}
/** Style returned by getFocusRingStyle for a focused element. */
export interface FocusRingStyle {
    borderColor?: string;
    prefix?: string;
}
/** Focus ring visual mode. */
export type FocusRingMode = "border" | "prefix" | "none";
/** Callback signature for focus change notifications. */
export type FocusChangeCallback = (focusedId: string | null, previousId: string | null) => void;
/** Keyboard focus routing, Tab cycling (with tabIndex + groups), and mouse hit-testing for ScrollViews. */
export declare class FocusManager {
    readonly entries: Map<string, FocusableEntry>;
    private order;
    private focusedId;
    private focusIndex;
    private listeners;
    private focusChangeListeners;
    private enabled;
    private scopeStack;
    /** Stack of trapped focus group IDs. The top is the active trap. */
    private trapStack;
    /** Auto-increment counter for registration-order tiebreaking */
    private registrationCounter;
    /** Map from entry ID to registration order (for stable sort tiebreaking) */
    private registrationOrder;
    /** Stack of element IDs to restore focus to when a trap is released. */
    private _focusRestoreStack;
    /** Focus ring visual mode — components query this via getFocusRingStyle(). */
    private _focusRingMode;
    /** Render-cycle counter — incremented on each tickRenderCycle() call. */
    private _renderCycle;
    /** The render cycle in which focus() was last called. */
    private _lastFocusCycle;
    /** Whether a double-focus warning was already emitted for the current cycle. */
    private _warnedThisCycle;
    /**
     * The ScrollView that currently owns keyboard scroll events.
     * Updated when mouse scroll hits a ScrollView (via hitTestScroll) or
     * when there is only one ScrollView registered.
     * ScrollView keyboard handlers check this before processing events.
     */
    private _activeScrollId;
    register(entry: FocusableEntry): void;
    unregister(id: string): void;
    focus(id: string): void;
    cycleNext(): void;
    cyclePrev(): void;
    /**
     * Trap focus within a group. Tab cycling will only visit entries
     * belonging to the specified groupId. Traps are stackable — calling
     * trapFocus again pushes a new trap, and releaseFocus pops it.
     *
     * When a trap is activated, focus moves to the first input in the group
     * if the currently focused element is outside it.
     */
    trapFocus(groupId: string): void;
    /**
     * Release the current focus trap. If there are nested traps, the previous
     * trap becomes active. If the focused entry is not in the restored scope,
     * focus moves to the first eligible input.
     */
    releaseFocus(): void;
    /**
     * Push a focus scope. After this call, newly registered entries belong to
     * this scope and Tab cycling is restricted to entries within it.
     */
    pushScope(scopeId: string): void;
    /**
     * Pop a focus scope. Removes the scope from the stack and restores
     * previous cycling behavior. If the currently focused entry belonged
     * to the removed scope, focus moves to the first input in the new
     * active scope (or any input if no scope remains).
     */
    popScope(scopeId: string): void;
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
    private sortedInputs;
    enableFocus(): void;
    disableFocus(): void;
    get isFocusEnabled(): boolean;
    isFocused(id: string): boolean;
    get focused(): string | null;
    getFocusedEntry(): FocusableEntry | undefined;
    get isTrapped(): boolean;
    get activeGroup(): string | null;
    /** Hit-test: find the ScrollView containing (x, y).
     *  Also updates activeScrollId so keyboard scroll routes to this ScrollView. */
    hitTestScroll(x: number, y: number): FocusableEntry | undefined;
    hitTestInput(x: number, y: number): FocusableEntry | undefined;
    /**
     * The ID of the ScrollView that should receive keyboard scroll events.
     * Returns the explicitly activated one, or auto-selects the sole ScrollView
     * if only one exists.
     */
    get activeScrollId(): string | null;
    setActiveScroll(id: string | null): void;
    updateBounds(id: string, x: number, y: number, width: number, height: number): void;
    onChange(fn: () => void): () => void;
    /**
     * Subscribe to focus changes with both new and previous focused IDs.
     * Returns an unsubscribe function.
     */
    onFocusChange(fn: FocusChangeCallback): () => void;
    /**
     * Handle Tab/Shift+Tab key press. Cycles focus to the next or previous
     * enabled input in tab order. Wraps around at the boundaries.
     * Disabled entries are skipped automatically (sortedInputs filters them).
     */
    handleTabKey(shift: boolean): void;
    /**
     * Returns a visual indicator style for the given element.
     * Components can query this to decide how to render a focus ring.
     * Returns null if the element is not focused or the ring is disabled.
     */
    getFocusRingStyle(id: string): FocusRingStyle | null;
    /**
     * Set the focus ring visual mode.
     * - "border": returns borderColor for styled borders
     * - "prefix": returns a prefix string ("▸ ") to prepend to focused text
     * - "none": disables focus ring (getFocusRingStyle always returns null)
     */
    setFocusRingStyle(mode: FocusRingMode): void;
    get focusRingMode(): FocusRingMode;
    /**
     * Increment the render cycle counter. Call this once per paint/render cycle
     * so the double-focus warning can detect multiple focus() calls in the same frame.
     */
    tickRenderCycle(): void;
    private notify;
    private notifyFocusChange;
}
//# sourceMappingURL=focus.d.ts.map