export interface UseHistoryOptions<T> {
    initial: T;
    maxLength?: number;
}
export interface UseHistoryResult<T> {
    current: T;
    push: (entry: T) => void;
    back: () => T | null;
    forward: () => T | null;
    canGoBack: boolean;
    canGoForward: boolean;
    clear: () => void;
    entries: readonly T[];
    index: number;
}
export declare function useHistory<T>(options: UseHistoryOptions<T>): UseHistoryResult<T>;
//# sourceMappingURL=useHistory.d.ts.map