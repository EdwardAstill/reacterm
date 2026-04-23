/**
 * FrameScheduler — throttles paint to maxFps, coalesces rapid React commits,
 * detects render loops, and warns when useState churn tanks performance.
 */
export class FrameScheduler {
    // Frame rate limiting
    minFrameInterval;
    frameScheduled = false;
    lastFrameTime = 0;
    pendingTimer = null;
    /** Monotonically increasing generation — incremented on every full paint.
     *  Pending doFrame microtasks compare their captured generation to detect
     *  that a full paint already superseded them (microtasks can't be cancelled). */
    _paintGeneration = 0;
    // Render loop detection
    framesThisSecond = 0;
    frameSecondStart = Date.now();
    static MAX_FRAMES_PER_SECOND = 200;
    // FPS tracking (rolling 1-second window)
    _frameCount = 0;
    frameTimes = [];
    _currentFps = 0;
    _unmounted = false;
    constructor(options = {}) {
        this.minFrameInterval = Math.max(1, Math.round(1000 / (options.maxFps ?? 60)));
    }
    get paintGeneration() {
        return this._paintGeneration;
    }
    get currentFps() {
        return this._currentFps;
    }
    get frameCount() {
        return this._frameCount;
    }
    get unmounted() {
        return this._unmounted;
    }
    setUnmounted() {
        this._unmounted = true;
    }
    /**
     * Schedule a fast repaint, coalescing rapid updates to stay within maxFps.
     * Calls `doFastRepaint` when it's time to paint.
     */
    scheduleFastRepaint(doFastRepaint) {
        if (this._unmounted || this.frameScheduled)
            return;
        const now = Date.now();
        if (now - this.frameSecondStart > 1000) {
            this.framesThisSecond = 0;
            this.frameSecondStart = now;
        }
        this.framesThisSecond++;
        if (this.framesThisSecond > FrameScheduler.MAX_FRAMES_PER_SECOND) {
            process.stderr.write(`\x1b[33m[storm] Warning: render loop detected (>${FrameScheduler.MAX_FRAMES_PER_SECOND} frames/s). Skipping frame. Check for setState calls in useInput handlers or requestRender() in a tight loop.\x1b[0m\n`);
            return;
        }
        this.frameScheduled = true;
        const elapsed = now - this.lastFrameTime;
        const capturedGen = this._paintGeneration;
        const guardedDoFrame = () => {
            this.frameScheduled = false;
            this.pendingTimer = null;
            if (this._unmounted)
                return;
            // If a full paint happened after this frame was scheduled, skip —
            // the full paint already flushed the correct state to the terminal.
            if (this._paintGeneration !== capturedGen)
                return;
            doFastRepaint();
        };
        if (elapsed >= this.minFrameInterval) {
            queueMicrotask(guardedDoFrame);
        }
        else {
            this.pendingTimer = setTimeout(guardedDoFrame, this.minFrameInterval - elapsed);
        }
    }
    /**
     * Called before a full paint — cancels any pending fast repaint and
     * bumps the paint generation so stale microtasks are skipped.
     */
    beginFullPaint() {
        this._paintGeneration++;
        this.frameScheduled = false;
        if (this.pendingTimer !== null) {
            clearTimeout(this.pendingTimer);
            this.pendingTimer = null;
        }
    }
    /** Update FPS counter and frame tracking after a paint completes. */
    recordFrame() {
        const now = Date.now();
        this.lastFrameTime = now;
        this._frameCount++;
        this.frameTimes.push(now);
        // Purge timestamps older than 1 second
        while (this.frameTimes.length > 0 && this.frameTimes[0] < now - 1000) {
            this.frameTimes.shift();
        }
        this._currentFps = this.frameTimes.length;
    }
    checkStateUpdateFrequency() {
        // No-op. Performance guidance is in ARCHITECTURE.md.
    }
    /** Cancel any pending timer during unmount. */
    cancelPending() {
        if (this.pendingTimer !== null) {
            clearTimeout(this.pendingTimer);
            this.pendingTimer = null;
        }
        this.frameScheduled = false;
    }
}
//# sourceMappingURL=frame-scheduler.js.map