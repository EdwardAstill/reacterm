export const easings = {
    linear: (t) => t,
    easeIn: (t) => t * t,
    easeOut: (t) => t * (2 - t),
    easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
};
/**
 * Create a new animation reference that interpolates from `from` to `to`
 * over `durationMs` milliseconds using the given easing function.
 *
 * The animation starts at the current time (Date.now()).
 */
export function createAnimation(from, to, durationMs, easing = easings.easeOut) {
    return {
        start: Date.now(),
        duration: durationMs,
        from,
        to,
        easing,
        current: from,
        done: false,
    };
}
/**
 * Advance the animation to the current time and return the interpolated value.
 *
 * Once the animation completes, `anim.done` is set to true and the returned
 * value is clamped to `anim.to`.
 */
export function tickAnimation(anim) {
    if (anim.done)
        return anim.to;
    const elapsed = Date.now() - anim.start;
    if (elapsed >= anim.duration) {
        anim.current = anim.to;
        anim.done = true;
        return anim.to;
    }
    const t = elapsed / anim.duration;
    const easedT = anim.easing(t);
    anim.current = anim.from + (anim.to - anim.from) * easedT;
    return anim.current;
}
//# sourceMappingURL=animate.js.map