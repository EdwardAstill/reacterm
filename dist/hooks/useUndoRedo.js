import { useRef } from "react";
import { useForceUpdate } from "./useForceUpdate.js";
export function useUndoRedo(options) {
    const { initial, maxHistory = 100 } = options;
    const forceUpdate = useForceUpdate();
    const currentRef = useRef(initial);
    const undoStackRef = useRef([]);
    const redoStackRef = useRef([]);
    const initializedRef = useRef(false);
    if (!initializedRef.current) {
        initializedRef.current = true;
        currentRef.current = initial;
    }
    const set = (newValue) => {
        undoStackRef.current.push(currentRef.current);
        // Trim undo stack if it exceeds maxHistory
        if (undoStackRef.current.length > maxHistory) {
            undoStackRef.current.splice(0, undoStackRef.current.length - maxHistory);
        }
        currentRef.current = newValue;
        redoStackRef.current.length = 0;
        forceUpdate();
    };
    const undo = () => {
        if (undoStackRef.current.length === 0)
            return null;
        const prev = undoStackRef.current.pop();
        redoStackRef.current.push(currentRef.current);
        currentRef.current = prev;
        forceUpdate();
        return prev;
    };
    const redo = () => {
        if (redoStackRef.current.length === 0)
            return null;
        const next = redoStackRef.current.pop();
        undoStackRef.current.push(currentRef.current);
        currentRef.current = next;
        forceUpdate();
        return next;
    };
    const clear = () => {
        undoStackRef.current.length = 0;
        redoStackRef.current.length = 0;
        currentRef.current = initial;
        forceUpdate();
    };
    return {
        value: currentRef.current,
        set,
        undo,
        redo,
        canUndo: undoStackRef.current.length > 0,
        canRedo: redoStackRef.current.length > 0,
        clear,
    };
}
//# sourceMappingURL=useUndoRedo.js.map