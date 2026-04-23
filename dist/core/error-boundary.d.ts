export interface RenderError {
    phase: "layout" | "paint" | "diff" | "flush" | "input";
    error: Error;
    component?: string;
    timestamp: number;
}
/** Configuration for the error boundary. */
export interface ErrorBoundaryOptions {
    /** Called when a render error occurs. */
    onError?: (error: RenderError) => void;
    /** Maximum consecutive errors before auto-exit (default 10). */
    maxConsecutiveErrors?: number;
    /** Show error overlay in terminal (default true). */
    showOverlay?: boolean;
}
/**
 * Tracks and manages errors across render phases. Wraps phase functions
 * in try/catch, counts consecutive failures, and triggers exit when
 * the failure threshold is exceeded.
 */
export declare class RenderErrorBoundary {
    private consecutiveErrors;
    private errors;
    private readonly options;
    constructor(options?: ErrorBoundaryOptions);
    /**
     * Wrap a function in error protection. If the function throws,
     * the error is recorded and `undefined` is returned.
     */
    protect<T>(phase: RenderError["phase"], fn: () => T): T | undefined;
    /** Record an error, notify the callback, and bump the consecutive counter. */
    recordError(error: RenderError): void;
    /** Reset the consecutive-error counter (call after a successful render). */
    resetCount(): void;
    /** Return a read-only view of recent errors. */
    getErrors(): readonly RenderError[];
    /** True when consecutive failures have exceeded the configured threshold. */
    shouldExit(): boolean;
    /** Format a RenderError into a human-readable terminal string. */
    formatError(error: RenderError): string;
}
//# sourceMappingURL=error-boundary.d.ts.map