export interface UseUndoRedoOptions<T> {
    initial: T;
    maxHistory?: number;
}
export interface UseUndoRedoResult<T> {
    value: T;
    set: (newValue: T) => void;
    undo: () => T | null;
    redo: () => T | null;
    canUndo: boolean;
    canRedo: boolean;
    clear: () => void;
}
export declare function useUndoRedo<T>(options: UseUndoRedoOptions<T>): UseUndoRedoResult<T>;
//# sourceMappingURL=useUndoRedo.d.ts.map