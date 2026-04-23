/**
 * Register a cleanup that fires on unmount AND app exit (signals, crashes).
 * useEffect cleanup does NOT fire reliably in Storm's reconciler. Use this instead.
 */
export declare function useCleanup(fn: () => void): void;
//# sourceMappingURL=useCleanup.d.ts.map