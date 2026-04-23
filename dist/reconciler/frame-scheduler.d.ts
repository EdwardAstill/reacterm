/**
 * FrameScheduler — throttles paint to maxFps, coalesces rapid React commits,
 * detects render loops, and warns when useState churn tanks performance.
 */
export interface FrameSchedulerOptions {
    maxFps?: number | undefined;
}
export declare class FrameScheduler {
    private readonly minFrameInterval;
    private frameScheduled;
    private lastFrameTime;
    private pendingTimer;
    /** Monotonically increasing generation — incremented on every full paint.
     *  Pending doFrame microtasks compare their captured generation to detect
     *  that a full paint already superseded them (microtasks can't be cancelled). */
    private _paintGeneration;
    private framesThisSecond;
    private frameSecondStart;
    private static readonly MAX_FRAMES_PER_SECOND;
    private _frameCount;
    private readonly frameTimes;
    private _currentFps;
    private _unmounted;
    constructor(options?: FrameSchedulerOptions);
    get paintGeneration(): number;
    get currentFps(): number;
    get frameCount(): number;
    get unmounted(): boolean;
    setUnmounted(): void;
    /**
     * Schedule a fast repaint, coalescing rapid updates to stay within maxFps.
     * Calls `doFastRepaint` when it's time to paint.
     */
    scheduleFastRepaint(doFastRepaint: () => void): void;
    /**
     * Called before a full paint — cancels any pending fast repaint and
     * bumps the paint generation so stale microtasks are skipped.
     */
    beginFullPaint(): void;
    /** Update FPS counter and frame tracking after a paint completes. */
    recordFrame(): void;
    checkStateUpdateFrequency(): void;
    /** Cancel any pending timer during unmount. */
    cancelPending(): void;
}
//# sourceMappingURL=frame-scheduler.d.ts.map