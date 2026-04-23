/**
 * useTransition -- declarative transition hook.
 *
 * Animates a numeric value between `from` and `to` with configurable
 * easing, duration, and delay. Uses the AnimationScheduler for frame
 * updates and requestRender() for the imperative update pattern.
 *
 * @example
 * ```tsx
 * function FadeIn() {
 *   const { value, isAnimating, start } = useTransition({
 *     from: 0, to: 1, duration: 300, easing: "easeOut",
 *   });
 *   // value animates 0 -> 1 on mount
 *   return <Box dim={value < 0.5}><Text>Hello</Text></Box>;
 * }
 * ```
 */
export interface TransitionConfig {
    /** Starting value. */
    from: number;
    /** Target value. */
    to: number;
    /** Duration in milliseconds (default: 200). */
    duration?: number;
    /** Easing function name (default: "easeOut"). */
    easing?: "linear" | "easeIn" | "easeOut" | "easeInOut" | "spring";
    /** Delay in milliseconds before the animation starts (default: 0). */
    delay?: number;
    /** Called when the animation reaches its target value. */
    onComplete?: () => void;
}
export interface UseTransitionResult {
    /** Current animated value. */
    value: number;
    /** Whether the animation is currently in progress. */
    isAnimating: boolean;
    /** Start a new transition, optionally overriding parts of the config. */
    start: (override?: Partial<TransitionConfig>) => void;
    /** Stop the current animation at whatever value it has reached. */
    stop: () => void;
    /** Reset the value to the initial `from` and cancel any running animation. */
    reset: () => void;
}
export declare function useTransition(config: TransitionConfig): UseTransitionResult;
//# sourceMappingURL=useTransition.d.ts.map