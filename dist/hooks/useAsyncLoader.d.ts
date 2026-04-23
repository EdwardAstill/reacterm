export interface UseAsyncLoaderOptions<T> {
    load: () => Promise<T>;
    autoLoad?: boolean;
    retryCount?: number;
    retryDelayMs?: number;
}
export interface UseAsyncLoaderResult<T> {
    data: T | null;
    isLoading: boolean;
    error: string | null;
    reload: () => void;
    retryCount: number;
}
export declare function useAsyncLoader<T>(options: UseAsyncLoaderOptions<T>): UseAsyncLoaderResult<T>;
//# sourceMappingURL=useAsyncLoader.d.ts.map