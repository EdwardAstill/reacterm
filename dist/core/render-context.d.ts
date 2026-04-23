import { FocusManager } from "./focus.js";
import { ScreenBuffer } from "./buffer.js";
import { AnimationScheduler } from "./animation-scheduler.js";
import type { MeasuredLayout } from "../reconciler/renderer.js";
import type { ResizeObserver } from "./resize-observer.js";
import { type StormColors } from "../theme/colors.js";
import type { BackgroundProp } from "../reconciler/types.js";
export interface LinkRange {
    url: string;
    y: number;
    x1: number;
    x2: number;
}
export interface DirtyRegion {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface RenderMetrics {
    /** Time taken for the last paint+diff+flush cycle in ms. */
    lastRenderTimeMs: number;
    /** Frames rendered per second (rolling 1-second window). */
    fps: number;
    /** Number of cells changed in the last frame. */
    cellsChanged: number;
    /** Total cells in the buffer (width * height). */
    totalCells: number;
    /** Total frames rendered since start. */
    frameCount: number;
}
export interface ScrollViewFrame {
    scrollTop: number;
    screenY1: number;
    screenY2: number;
    screenX1: number;
    screenX2: number;
}
export declare class RenderContext {
    /** Focus manager for this render instance. */
    readonly focus: FocusManager;
    /** Layout measurements populated during each paint pass. */
    readonly measureMap: Map<string, MeasuredLayout>;
    /** Active resize observers for this render instance. */
    readonly resizeObservers: Set<ResizeObserver>;
    /** Link ranges populated during paint — consumed by the diff renderer for OSC 8 output. */
    links: LinkRange[];
    /** Cleanup functions registered by components. Called on unmount. */
    readonly cleanups: Map<string, () => void>;
    /** Async cleanup functions registered by components. Awaited on unmount after sync cleanups. */
    readonly asyncCleanups: Map<string, () => Promise<void>>;
    /** Global animation scheduler — single timer for all animations. */
    readonly animationScheduler: AnimationScheduler;
    /** Cursor position for focused TextInput (-1 if none). Set during paint. */
    cursorX: number;
    cursorY: number;
    /** Reusable buffer — avoids allocation on every frame. */
    buffer: ScreenBuffer | null;
    /** Whether layout has been computed for the current tree. */
    layoutBuilt: boolean;
    /** Set to true when layout is invalidated (content change). Cleared after flush.
     *  When true, scroll region optimization (DECSTBM) is skipped because
     *  content changed — DECSTBM only works for pure scroll operations. */
    layoutInvalidated: boolean;
    /** Width used for the last layout computation. */
    lastLayoutWidth: number;
    /** Height used for the last layout computation. */
    lastLayoutHeight: number;
    /** Monotonically increasing version for styled-run cache invalidation. */
    runsVersion: number;
    /** Scroll state per ScrollView for native scroll optimization */
    scrollViewStates: Map<string, ScrollViewFrame>;
    prevScrollViewStates: Map<string, ScrollViewFrame>;
    /** Graphics protocol escape sequences to write AFTER the diff renderer output.
     *  Populated by the Image component; consumed by screen.flush(). */
    pendingImageSequences: {
        seq: string;
        row: number;
        col: number;
    }[];
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
    readonly emittedImages: Map<string, string>;
    /** Image position keys seen during the current paint pass. */
    private _currentFrameImageKeys;
    /**
     * Image regions that the diff renderer must SKIP (not overwrite).
     * Key: row number, Value: array of {x1, x2} column ranges.
     * Populated by paintBox, consumed by diff renderer.
     */
    imageRegions: Map<number, {
        x1: number;
        x2: number;
    }[]>;
    /** Called by paintBox when an image element is encountered. */
    trackImageForFrame(key: string): void;
    /** Register an image region so the diff renderer skips those cells. */
    addImageRegion(x: number, y: number, w: number, h: number): void;
    /**
     * Called after each paint pass to prune emittedImages of entries
     * that are no longer in the tree (component unmounted).
     */
    pruneStaleImages(): void;
    /** Regions marked as needing repaint. Empty array means full repaint. */
    dirtyRegions: DirtyRegion[];
    /** Active theme colors — set by render() from ThemeProvider, used by renderer for fallback colors. */
    theme: StormColors;
    /** Root-level background pattern — set by render() options, painted before the component tree. */
    rootBackground: BackgroundProp | undefined;
    /** Latest render metrics, updated after each frame. */
    metrics: RenderMetrics;
    constructor();
    /** When true, only dirty subtrees should be painted. */
    _incrementalPaint: boolean;
    /** Set by paint() when buffer.clear() was called. */
    _bufferCleared: boolean;
    /** Set by requestRender() — visual change occurred. Cleared after repaint. */
    _renderRequested: boolean;
    /** Prepare for next frame — pointer swap, no copy. */
    swapScrollStates(): void;
    /** Remove measurement data for a component. */
    removeMeasure(id: string): void;
    /** Remove a resize observer instance. */
    removeResizeObserver(observer: ResizeObserver): void;
    /**
     * Purge stale measurement entries not in the active tree.
     * Call periodically to prevent unbounded growth of measureMap.
     */
    purgeStaleMeasurements(activeIds: Set<string>): void;
    /** Mark layout as dirty — must be rebuilt on next paint. */
    invalidateLayout(): void;
    /**
     * Release all internal state to prevent memory leaks.
     * Call this when the render instance is being torn down (e.g., renderToString unmount).
     */
    dispose(): void;
    /** Mark a rectangular region as needing repaint. */
    markDirty(region: DirtyRegion): void;
    /** Clear all dirty regions (called after a frame is painted). */
    clearDirty(): void;
    /**
     * Returns true when no specific dirty regions have been marked,
     * meaning the entire screen should be repainted.
     */
    isFullyDirty(): boolean;
}
//# sourceMappingURL=render-context.d.ts.map