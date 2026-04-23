/**
 * useTick — the safe animation/polling hook.
 *
 * Calls your callback every `intervalMs` with an incrementing tick count.
 * Two modes controlled by `reactive` (default: true):
 *
 * **Reactive mode** (default) — triggers a React re-render after each
 * tick so computed values in JSX update naturally. Use for live metrics,
 * polling, streaming text, or any interval ≥ ~50ms:
 *
 * ```tsx
 * useTick(500, () => {
 *   dataRef.current.push(fetchLatest());
 * });
 * const latest = dataRef.current.at(-1); // updates every tick
 * return <Text>{latest}</Text>;
 * ```
 *
 * **Imperative mode** (`reactive: false`) — calls `requestRender()`
 * for a cell-level repaint with zero React reconciliation. Use for
 * high-frequency animation (spinners, frame cycling):
 *
 * ```tsx
 * useTick(80, (tick) => {
 *   spinnerRef.current.text = FRAMES[tick % FRAMES.length];
 * }, { reactive: false });
 * ```
 *
 * Returns the current tick count.
 */
export interface UseTickOptions {
    /** When false, the timer pauses. Default: true. */
    active?: boolean;
    /**
     * When true (default), triggers a React re-render after each tick so
     * computed values in JSX update. Set to false for pure imperative
     * animation where you only mutate text nodes via refs.
     */
    reactive?: boolean;
}
export declare function useTick(intervalMs: number, callback: (tick: number) => void, options?: UseTickOptions): number;
//# sourceMappingURL=useTick.d.ts.map