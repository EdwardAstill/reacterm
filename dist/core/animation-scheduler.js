export class AnimationScheduler {
    callbacks = new Set();
    timer = null;
    idleTimer = null;
    intervalMs;
    maxIdleMs;
    requestRender = null;
    constructor(intervalMs = 80, maxIdleMs = 5000) {
        this.intervalMs = intervalMs;
        this.maxIdleMs = maxIdleMs;
    }
    /** Set the render trigger function */
    setRenderTrigger(fn) {
        this.requestRender = fn;
    }
    /** Register an animation callback. Returns unsubscribe function. */
    add(callback) {
        this.callbacks.add(callback);
        // A callback was added — cancel any pending idle shutdown
        this.clearIdleTimer();
        this.ensureRunning();
        return () => {
            this.callbacks.delete(callback);
            if (this.callbacks.size === 0) {
                // Start idle timer — if no new callbacks arrive in maxIdleMs, stop
                this.startIdleTimer();
            }
        };
    }
    /** Number of active animations */
    get count() {
        return this.callbacks.size;
    }
    /** Start the single timer if not running */
    ensureRunning() {
        if (this.timer !== null)
            return;
        this.timer = setInterval(() => {
            const now = Date.now();
            for (const cb of this.callbacks) {
                cb(now);
            }
            this.requestRender?.();
        }, this.intervalMs);
    }
    /** Stop the animation timer */
    stop() {
        if (this.timer !== null) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    /** Start idle shutdown timer */
    startIdleTimer() {
        this.clearIdleTimer();
        this.idleTimer = setTimeout(() => {
            this.idleTimer = null;
            if (this.callbacks.size === 0) {
                this.stop();
            }
        }, this.maxIdleMs);
    }
    /** Cancel pending idle shutdown */
    clearIdleTimer() {
        if (this.idleTimer !== null) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }
    /** Clean up everything */
    destroy() {
        this.clearIdleTimer();
        this.stop();
        this.callbacks.clear();
        this.requestRender = null;
    }
}
//# sourceMappingURL=animation-scheduler.js.map