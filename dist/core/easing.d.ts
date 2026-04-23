export declare const ease: {
    readonly linear: (t: number) => number;
    readonly easeInQuad: (t: number) => number;
    readonly easeOutQuad: (t: number) => number;
    readonly easeInOutQuad: (t: number) => number;
    readonly easeInCubic: (t: number) => number;
    readonly easeOutCubic: (t: number) => number;
    readonly easeInOutCubic: (t: number) => number;
    /** Bounce at the end */
    readonly easeOutBounce: (t: number) => number;
    /** Spring-like overshoot */
    readonly easeOutBack: (t: number) => number;
    /** Elastic oscillation at the end */
    readonly easeOutElastic: (t: number) => number;
    /** Elastic oscillation at both ends */
    readonly easeInOutElastic: (t: number) => number;
    /** Exponential deceleration */
    readonly easeOutExpo: (t: number) => number;
    /** Exponential acceleration and deceleration */
    readonly easeInOutExpo: (t: number) => number;
};
export type EasingFunction = (t: number) => number;
/**
 * Create a spring-based easing function.
 *
 * @param damping  - Damping ratio (0 = no damping / infinite oscillation,
 *                   1 = critically damped / no overshoot). Typical: 0.5–0.8.
 * @param stiffness - Spring stiffness. Higher = faster. Typical: 100–300.
 * @returns An easing function (t: 0-1) => value (may overshoot 0-1 range).
 */
export declare function spring(damping: number, stiffness: number): EasingFunction;
//# sourceMappingURL=easing.d.ts.map