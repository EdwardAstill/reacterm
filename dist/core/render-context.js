import { FocusManager } from "./focus.js";
import { AnimationScheduler } from "./animation-scheduler.js";
import { colors as defaultColors } from "../theme/colors.js";
export class RenderContext {
    /** Focus manager for this render instance. */
    focus;
    /** Layout measurements populated during each paint pass. */
    measureMap;
    /** Active resize observers for this render instance. */
    resizeObservers;
    /** Link ranges populated during paint — consumed by the diff renderer for OSC 8 output. */
    links = [];
    /** Cleanup functions registered by components. Called on unmount. */
    cleanups;
    /** Async cleanup functions registered by components. Awaited on unmount after sync cleanups. */
    asyncCleanups;
    /** Global animation scheduler — single timer for all animations. */
    animationScheduler;
    // ── Renderer state ──────────────────────────────────────────────
    /** Cursor position for focused TextInput (-1 if none). Set during paint. */
    cursorX = -1;
    cursorY = -1;
    /** Reusable buffer — avoids allocation on every frame. */
    buffer = null;
    /** Whether layout has been computed for the current tree. */
    layoutBuilt = false;
    /** Set to true when layout is invalidated (content change). Cleared after flush.
     *  When true, scroll region optimization (DECSTBM) is skipped because
     *  content changed — DECSTBM only works for pure scroll operations. */
    layoutInvalidated = false;
    /** Width used for the last layout computation. */
    lastLayoutWidth = 0;
    /** Height used for the last layout computation. */
    lastLayoutHeight = 0;
    /** Monotonically increasing version for styled-run cache invalidation. */
    runsVersion = 1;
    /** Scroll state per ScrollView for native scroll optimization */
    scrollViewStates = new Map();
    prevScrollViewStates = new Map();
    // ── Pending image sequences ─────────────────────────────────────
    /** Graphics protocol escape sequences to write AFTER the diff renderer output.
     *  Populated by the Image component; consumed by screen.flush(). */
    pendingImageSequences = [];
    /**
     * Tracks image sequences that have already been emitted to the terminal.
     * Key: `${row},${col}` — the layout position of the image spacer box.
     * Value: the escape sequence string that was written.
     *
     * On each paint pass, paintBox checks this map before queuing a sequence:
     * - If the key exists AND the value matches, the image is unchanged → skip.
     * - If the key is missing or the value differs (src changed) → queue it.
     *
     * After each paint, emittedImages is pruned to only keep entries that were
     * seen in the current frame (handles unmount cleanup).
     */
    emittedImages = new Map();
    /** Image position keys seen during the current paint pass. */
    _currentFrameImageKeys = new Set();
    /**
     * Image regions that the diff renderer must SKIP (not overwrite).
     * Key: row number, Value: array of {x1, x2} column ranges.
     * Populated by paintBox, consumed by diff renderer.
     */
    imageRegions = new Map();
    /** Called by paintBox when an image element is encountered. */
    trackImageForFrame(key) {
        this._currentFrameImageKeys.add(key);
    }
    /** Register an image region so the diff renderer skips those cells. */
    addImageRegion(x, y, w, h) {
        for (let row = y; row < y + h; row++) {
            let ranges = this.imageRegions.get(row);
            if (!ranges) {
                ranges = [];
                this.imageRegions.set(row, ranges);
            }
            ranges.push({ x1: x, x2: x + w });
        }
    }
    /**
     * Called after each paint pass to prune emittedImages of entries
     * that are no longer in the tree (component unmounted).
     */
    pruneStaleImages() {
        for (const k of this.emittedImages.keys()) {
            if (!this._currentFrameImageKeys.has(k)) {
                this.emittedImages.delete(k);
            }
        }
        this._currentFrameImageKeys.clear();
        this.imageRegions.clear();
    }
    // ── Dirty region tracking ────────────────────────────────────────
    /** Regions marked as needing repaint. Empty array means full repaint. */
    dirtyRegions = [];
    // ── Render metrics ───────────────────────────────────────────────
    /** Active theme colors — set by render() from ThemeProvider, used by renderer for fallback colors. */
    theme = defaultColors;
    /** Root-level background pattern — set by render() options, painted before the component tree. */
    rootBackground = undefined;
    /** Latest render metrics, updated after each frame. */
    metrics = {
        lastRenderTimeMs: 0,
        fps: 0,
        cellsChanged: 0,
        totalCells: 0,
        frameCount: 0,
    };
    constructor() {
        this.focus = new FocusManager();
        this.measureMap = new Map();
        this.resizeObservers = new Set();
        this.cleanups = new Map();
        this.asyncCleanups = new Map();
        this.animationScheduler = new AnimationScheduler();
    }
    /** When true, only dirty subtrees should be painted. */
    _incrementalPaint = false;
    /** Set by paint() when buffer.clear() was called. */
    _bufferCleared = false;
    /** Set by requestRender() — visual change occurred. Cleared after repaint. */
    _renderRequested = false;
    /** Prepare for next frame — pointer swap, no copy. */
    swapScrollStates() {
        const tmp = this.prevScrollViewStates;
        this.prevScrollViewStates = this.scrollViewStates;
        this.scrollViewStates = tmp;
        this.scrollViewStates.clear();
    }
    // ── Cleanup API ─────────────────────────────────────────────────────
    /** Remove measurement data for a component. */
    removeMeasure(id) {
        this.measureMap.delete(id);
    }
    /** Remove a resize observer instance. */
    removeResizeObserver(observer) {
        this.resizeObservers.delete(observer);
    }
    /**
     * Purge stale measurement entries not in the active tree.
     * Call periodically to prevent unbounded growth of measureMap.
     */
    purgeStaleMeasurements(activeIds) {
        for (const id of this.measureMap.keys()) {
            if (!activeIds.has(id))
                this.measureMap.delete(id);
        }
    }
    /** Mark layout as dirty — must be rebuilt on next paint. */
    invalidateLayout() {
        this.layoutBuilt = false;
        this.layoutInvalidated = true;
    }
    /**
     * Release all internal state to prevent memory leaks.
     * Call this when the render instance is being torn down (e.g., renderToString unmount).
     */
    dispose() {
        this.animationScheduler.destroy();
        this.measureMap.clear();
        this.resizeObservers.clear();
        this.links.length = 0;
        for (const fn of this.cleanups.values()) {
            try {
                fn();
            }
            catch { /* swallow cleanup errors */ }
        }
        this.cleanups.clear();
        this.asyncCleanups.clear();
        this.scrollViewStates.clear();
        this.prevScrollViewStates.clear();
        this.pendingImageSequences.length = 0;
        this.emittedImages.clear();
        this._currentFrameImageKeys.clear();
        this.imageRegions.clear();
        this.dirtyRegions.length = 0;
        this.buffer = null;
    }
    // ── Dirty region API ─────────────────────────────────────────────
    /** Mark a rectangular region as needing repaint. */
    markDirty(region) {
        this.dirtyRegions.push(region);
    }
    /** Clear all dirty regions (called after a frame is painted). */
    clearDirty() {
        this.dirtyRegions = [];
        this.layoutInvalidated = false;
    }
    /**
     * Returns true when no specific dirty regions have been marked,
     * meaning the entire screen should be repainted.
     */
    isFullyDirty() {
        return this.dirtyRegions.length === 0;
    }
}
//# sourceMappingURL=render-context.js.map