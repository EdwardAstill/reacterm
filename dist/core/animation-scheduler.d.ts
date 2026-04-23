export type AnimationCallback = (frameTime: number) => void;
export declare class AnimationScheduler {
    private callbacks;
    private timer;
    private idleTimer;
    private intervalMs;
    private maxIdleMs;
    private requestRender;
    constructor(intervalMs?: number, maxIdleMs?: number);
    /** Set the render trigger function */
    setRenderTrigger(fn: () => void): void;
    /** Register an animation callback. Returns unsubscribe function. */
    add(callback: AnimationCallback): () => void;
    /** Number of active animations */
    get count(): number;
    /** Start the single timer if not running */
    private ensureRunning;
    /** Stop the animation timer */
    private stop;
    /** Start idle shutdown timer */
    private startIdleTimer;
    /** Cancel pending idle shutdown */
    private clearIdleTimer;
    /** Clean up everything */
    destroy(): void;
}
//# sourceMappingURL=animation-scheduler.d.ts.map