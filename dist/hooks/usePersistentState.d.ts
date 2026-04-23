export interface StateStorage {
    get(key: string): string | null;
    set(key: string, value: string): void;
    remove(key: string): void;
}
/** Default in-memory storage backed by a Map. */
export declare function memoryStorage(): StateStorage;
export interface UsePersistentStateOptions<T> {
    key: string;
    initial: T;
    serialize?: (value: T) => string;
    deserialize?: (raw: string) => T;
    storage?: StateStorage;
}
export interface UsePersistentStateResult<T> {
    value: T;
    set: (newValue: T) => void;
    reset: () => void;
}
export declare function usePersistentState<T>(options: UsePersistentStateOptions<T>): UsePersistentStateResult<T>;
//# sourceMappingURL=usePersistentState.d.ts.map