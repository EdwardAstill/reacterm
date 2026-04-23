/**
 * Register an async cleanup function that runs when the app unmounts.
 * Async cleanups run after sync cleanups and complete before `waitUntilExit()` resolves.
 */
export declare function useAsyncCleanup(fn: () => Promise<void>): void;
//# sourceMappingURL=useAsyncCleanup.d.ts.map