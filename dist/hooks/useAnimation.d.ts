import type { HostTextNode } from "../reconciler/types.js";
export interface UseAnimationOptions {
    /** Frame rate in ms (default: 80) */
    interval?: number;
    /** Only animate when true (default: true) */
    active?: boolean;
    /** Starting frame index (default: 0). Useful for offsetting multiple
     *  spinners so they don't animate in lockstep. */
    initialFrame?: number;
}
export interface UseAnimationResult {
    /** Current frame index (0-based, wraps automatically) */
    frame: number;
    /** Ref to a text node — set its .text for imperative updates */
    textRef: React.RefObject<HostTextNode | null>;
    /** Manually advance one frame */
    tick: () => void;
}
/**
 * useAnimation — reusable animation hook.
 *
 * Registers with the global AnimationScheduler instead of creating its own
 * setInterval. The scheduler ticks all animations on a single timer and
 * calls requestRender() once per tick, preventing timer thrashing.
 *
 * @example
 * const FRAMES = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
 * function MySpinner() {
 *   const { frame, textRef } = useAnimation({ interval: 80 });
 *   return <tui-text _textNodeRef={textRef}>{FRAMES[frame % FRAMES.length]}</tui-text>;
 * }
 */
export declare function useAnimation(options?: UseAnimationOptions): UseAnimationResult;
//# sourceMappingURL=useAnimation.d.ts.map