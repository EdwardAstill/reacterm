import type { MouseButton } from "../input/types.js";
export interface UseMousePositionOptions {
    /** Stop tracking when false. Default: true. */
    isActive?: boolean;
    /**
     * Update the rendered tree on every mouse move.
     *
     * - `false` (default): the hook tracks position imperatively but only
     *   re-renders on press/release/scroll. Cheaper and what most components
     *   want — they read the latest position from the returned ref.
     * - `true`: forces a render on every move. Use sparingly — moving the
     *   mouse can fire dozens of events per second.
     */
    trackMoves?: boolean;
}
export interface MousePositionState {
    /** 0-indexed column of the most recent move/press/release. */
    x: number;
    /** 0-indexed row of the most recent move/press/release. */
    y: number;
    /** Last button observed. `"none"` until the first event arrives. */
    button: MouseButton;
    /** True once at least one mouse event has been received. */
    ready: boolean;
}
export interface UseMousePositionResult {
    /** Render-time snapshot of the most recent position. */
    position: MousePositionState;
    /**
     * Live ref to the latest position. Read this from inside event handlers
     * to skip the React render cycle entirely. The object is mutated in place,
     * so do not destructure across renders.
     */
    positionRef: React.RefObject<MousePositionState>;
    /**
     * Convenience: is the cursor inside the rectangle defined by
     * `[left, top, left+width, top+height]`? Bounds are inclusive of the
     * top-left and exclusive of the bottom-right (matching layout convention).
     */
    isInside(rect: {
        left: number;
        top: number;
        width: number;
        height: number;
    }): boolean;
}
/**
 * Track the latest mouse position within the app's terminal cell grid.
 *
 * Replaces the boilerplate of `useMouse` + a manual `useRef<{x,y}>` that most
 * mouse-aware components need. By default, moves only update the ref — call
 * with `trackMoves: true` if you need the rendered tree to follow the cursor.
 *
 * @example
 * function Crosshair() {
 *   const { position } = useMousePosition({ trackMoves: true });
 *   return <Text>{position.x},{position.y}</Text>;
 * }
 *
 * @example
 * function HoverHighlight({ rect }: { rect: Rect }) {
 *   const { positionRef, isInside } = useMousePosition();
 *   useTick(50, () => {
 *     // read ref imperatively; no render churn on raw mouse moves
 *   });
 *   return isInside(rect) ? <Text bold>inside</Text> : <Text dim>outside</Text>;
 * }
 */
export declare function useMousePosition(options?: UseMousePositionOptions): UseMousePositionResult;
//# sourceMappingURL=useMousePosition.d.ts.map