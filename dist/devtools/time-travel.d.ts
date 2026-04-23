/**
 * Time-travel debugging — record and replay frame history.
 *
 * Records the last N frame buffers in a circular buffer. When activated,
 * pauses live rendering and lets the user scrub through frame history
 * with left/right arrow keys.
 *
 * Usage:
 * ```ts
 * const tt = createTimeTravel({ maxFrames: 120 }); // 2 seconds at 60fps
 * // Register as middleware
 * ctx.addMiddleware(tt.middleware);
 * // After each paint, call capture:
 * tt.captureFrame(buffer, trigger, paintMs);
 * ```
 */
import { ScreenBuffer } from "../core/buffer.js";
import type { RenderMiddleware } from "../core/middleware.js";
export interface FrameSnapshot {
    /** Frame number */
    frame: number;
    /** Timestamp when frame was captured */
    timestamp: number;
    /** Copy of the cell buffer data */
    chars: string[];
    fgs: Int32Array;
    bgs: Int32Array;
    attrs: Uint8Array;
    ulColors: Int32Array;
    width: number;
    height: number;
    /** What triggered this frame */
    trigger: "commit" | "repaint" | "resize" | "animation";
    /** Paint duration in ms */
    paintMs: number;
    /** Number of cells that changed from previous frame */
    cellsChanged: number;
}
export interface TimeTravelState {
    /** Whether time-travel mode is active (paused on a historical frame) */
    isActive: boolean;
    /** Current frame index being viewed (0 = oldest, length-1 = newest) */
    currentIndex: number;
    /** Total frames stored */
    frameCount: number;
    /** Current snapshot being viewed (null if not active) */
    currentSnapshot: FrameSnapshot | null;
}
/**
 * Creates a time-travel debugging system.
 *
 * Records the last N frame buffers. When activated (via keyboard shortcut),
 * pauses live rendering and lets the user scrub through frame history
 * with left/right arrow keys.
 */
export declare function createTimeTravel(options?: {
    /** Max frames to store (default: 120) */
    maxFrames?: number;
}): {
    /** Middleware that renders the time-travel UI when active */
    middleware: RenderMiddleware;
    /** Capture a frame snapshot after paint */
    captureFrame: (buffer: ScreenBuffer, trigger: FrameSnapshot["trigger"], paintMs: number) => void;
    /** Enter time-travel mode (pause on current frame) */
    enter: () => void;
    /** Exit time-travel mode (resume live rendering) */
    exit: () => void;
    /** Toggle time-travel mode */
    toggle: () => void;
    /** Go to previous frame */
    prevFrame: () => void;
    /** Go to next frame */
    nextFrame: () => void;
    /** Jump to specific frame index */
    goToFrame: (index: number) => void;
    /** Get current state */
    getState: () => TimeTravelState;
    /** Get a specific frame snapshot */
    getSnapshot: (index: number) => FrameSnapshot | null;
};
//# sourceMappingURL=time-travel.d.ts.map