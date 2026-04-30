import { useRef } from "react";
import { useMouse } from "./useMouse.js";
import { useTui } from "../context/TuiContext.js";
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
export function useMousePosition(options = {}) {
    const { isActive = true, trackMoves = false } = options;
    const { requestRender } = useTui();
    const stateRef = useRef({
        x: -1,
        y: -1,
        button: "none",
        ready: false,
    });
    useMouse((event) => {
        const s = stateRef.current;
        s.x = event.x;
        s.y = event.y;
        s.button = event.button;
        s.ready = true;
        // Press/release/scroll always trigger a render — they're discrete events
        // a consumer almost certainly cares about. Moves only render when opted in.
        if (event.action !== "move" || trackMoves) {
            requestRender();
        }
    }, { isActive });
    const isInside = (rect) => {
        const { x, y, ready } = stateRef.current;
        if (!ready)
            return false;
        return (x >= rect.left
            && x < rect.left + rect.width
            && y >= rect.top
            && y < rect.top + rect.height);
    };
    return {
        position: stateRef.current,
        positionRef: stateRef,
        isInside,
    };
}
//# sourceMappingURL=useMousePosition.js.map