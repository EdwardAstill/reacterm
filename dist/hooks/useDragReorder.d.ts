export interface UseDragReorderOptions<T> {
    items: T[];
    isActive?: boolean;
    onReorder: (items: T[]) => void;
}
export interface UseDragReorderResult {
    isDragging: boolean;
    dragIndex: number | null;
    startDrag: (index: number) => void;
    drop: () => void;
    cancel: () => void;
}
export declare function useDragReorder<T>(options: UseDragReorderOptions<T>): UseDragReorderResult;
//# sourceMappingURL=useDragReorder.d.ts.map