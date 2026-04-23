import type { HostTextNode } from "../reconciler/types.js";
export interface UseImperativeAnimationOptions {
    /** Whether the animation is currently active (default true). */
    active?: boolean;
    /** Interval in milliseconds between ticks. */
    intervalMs: number;
    /**
     * Called every tick. Mutate textNode.text (or any refs you own)
     * and the hook will call requestRender() automatically afterward.
     *
     * Return `false` to stop the timer (self-terminating animations).
     * Any other return value (including `undefined`) keeps the timer running.
     */
    onTick: () => boolean | void;
}
export interface UseImperativeAnimationResult {
    textNodeRef: React.RefObject<HostTextNode | null>;
    /** Stable ref to the latest requestRender — useful if the caller
     *  needs to trigger a render outside of the tick cycle. */
    requestRenderRef: React.RefObject<() => void>;
}
/**
 * Timer + requestRender() loop for animations that bypass React state.
 * Use this instead of useState + useEffect when you need 60fps text updates
 * (spinners, shimmer, streaming). Mutate the textNodeRef directly in onTick.
 */
export declare function useImperativeAnimation(options: UseImperativeAnimationOptions): UseImperativeAnimationResult;
//# sourceMappingURL=useImperativeAnimation.d.ts.map