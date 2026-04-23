export type EasingFn = (t: number) => number;
export declare const easings: {
    readonly linear: (t: number) => number;
    readonly easeIn: (t: number) => number;
    readonly easeOut: (t: number) => number;
    readonly easeInOut: (t: number) => number;
};
export interface AnimationRef {
    start: number;
    duration: number;
    from: number;
    to: number;
    easing: EasingFn;
    current: number;
    done: boolean;
}
/**
 * Create a new animation reference that interpolates from `from` to `to`
 * over `durationMs` milliseconds using the given easing function.
 *
 * The animation starts at the current time (Date.now()).
 */
export declare function createAnimation(from: number, to: number, durationMs: number, easing?: EasingFn): AnimationRef;
/**
 * Advance the animation to the current time and return the interpolated value.
 *
 * Once the animation completes, `anim.done` is set to true and the returned
 * value is clamped to `anim.to`.
 */
export declare function tickAnimation(anim: AnimationRef): number;
//# sourceMappingURL=animate.d.ts.map