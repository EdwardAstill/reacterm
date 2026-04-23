/**
 * usePhaseTimer — schedule phase transitions with zero boilerplate.
 *
 * Replaces the manual setTimeout-chain pattern with a declarative timeline.
 * Each phase fires at its scheduled time, calls `flushSync` to update React
 * state, and cleans up automatically on unmount.
 *
 * ```tsx
 * // BEFORE — manual setTimeout chains, manual cleanup, easy to leak
 * const timers = useRef([]);
 * if (!started.current) {
 *   started.current = true;
 *   timers.current.push(setTimeout(() => flushSync(() => setPhase("boot")), 2000));
 *   timers.current.push(setTimeout(() => flushSync(() => setPhase("ready")), 4000));
 * }
 * useCleanup(() => timers.current.forEach(clearTimeout));
 *
 * // AFTER — declarative timeline, auto-cleanup
 * const phase = usePhaseTimer([
 *   { at: 0,    phase: "splash" },
 *   { at: 2000, phase: "boot" },
 *   { at: 4000, phase: "ready" },
 *   { at: 6000, phase: "running" },
 * ]);
 * ```
 */
export interface PhaseEntry<P extends string> {
    /** Milliseconds from start when this phase activates. */
    at: number;
    /** Phase identifier. */
    phase: P;
    /** Optional callback fired when this phase activates. */
    onEnter?: () => void;
}
export interface UsePhaseTimerOptions {
    /** When false, the timer doesn't start. Default: true. */
    autoStart?: boolean;
}
export interface UsePhaseTimerResult<P extends string> {
    /** Current phase. */
    phase: P;
    /** Milliseconds elapsed since start. */
    elapsed: number;
    /** Whether all phases have been reached. */
    done: boolean;
    /** Manually start (if autoStart was false). */
    start: () => void;
    /** Reset to the first phase. */
    reset: () => void;
}
export declare function usePhaseTimer<P extends string>(timeline: readonly PhaseEntry<P>[], options?: UsePhaseTimerOptions): UsePhaseTimerResult<P>;
//# sourceMappingURL=usePhaseTimer.d.ts.map