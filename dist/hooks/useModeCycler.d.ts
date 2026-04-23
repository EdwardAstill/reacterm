export interface UseModeCyclerOptions<T> {
    modes: T[];
    cycleKey: {
        key: string;
        ctrl?: boolean;
        shift?: boolean;
        meta?: boolean;
    };
    reverseCycleKey?: {
        key: string;
        ctrl?: boolean;
        shift?: boolean;
        meta?: boolean;
    };
    initial?: T;
    isActive?: boolean;
    onChange?: (mode: T, prevMode: T) => void;
}
export interface UseModeCyclerResult<T> {
    mode: T;
    index: number;
    setMode: (mode: T) => void;
}
export declare function useModeCycler<T>(options: UseModeCyclerOptions<T>): UseModeCyclerResult<T>;
//# sourceMappingURL=useModeCycler.d.ts.map