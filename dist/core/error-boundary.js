const DEFAULT_MAX_CONSECUTIVE_ERRORS = 10;
const MAX_STORED_ERRORS = 100;
/**
 * Tracks and manages errors across render phases. Wraps phase functions
 * in try/catch, counts consecutive failures, and triggers exit when
 * the failure threshold is exceeded.
 */
export class RenderErrorBoundary {
    consecutiveErrors = 0;
    errors = [];
    options;
    constructor(options) {
        this.options = {
            onError: options?.onError ?? (() => { }),
            maxConsecutiveErrors: options?.maxConsecutiveErrors ?? DEFAULT_MAX_CONSECUTIVE_ERRORS,
            showOverlay: options?.showOverlay ?? true,
        };
    }
    /**
     * Wrap a function in error protection. If the function throws,
     * the error is recorded and `undefined` is returned.
     */
    protect(phase, fn) {
        try {
            const result = fn();
            // Successful execution — reset the consecutive counter.
            this.resetCount();
            return result;
        }
        catch (raw) {
            const error = {
                phase,
                error: raw instanceof Error ? raw : new Error(String(raw)),
                timestamp: Date.now(),
            };
            this.recordError(error);
            return undefined;
        }
    }
    /** Record an error, notify the callback, and bump the consecutive counter. */
    recordError(error) {
        this.consecutiveErrors++;
        this.errors.push(error);
        // Cap stored errors to avoid unbounded memory growth.
        if (this.errors.length > MAX_STORED_ERRORS) {
            this.errors = this.errors.slice(-MAX_STORED_ERRORS);
        }
        this.options.onError(error);
    }
    /** Reset the consecutive-error counter (call after a successful render). */
    resetCount() {
        this.consecutiveErrors = 0;
    }
    /** Return a read-only view of recent errors. */
    getErrors() {
        return this.errors;
    }
    /** True when consecutive failures have exceeded the configured threshold. */
    shouldExit() {
        return this.consecutiveErrors >= this.options.maxConsecutiveErrors;
    }
    /** Format a RenderError into a human-readable terminal string. */
    formatError(error) {
        const ts = new Date(error.timestamp).toISOString();
        const comp = error.component ? ` in <${error.component}>` : "";
        const header = `[Storm Error] ${error.phase}${comp} @ ${ts}`;
        const message = error.error.message;
        const stack = error.error.stack
            ? "\n" + error.error.stack.split("\n").slice(1).join("\n")
            : "";
        return `${header}\n  ${message}${stack}`;
    }
}
//# sourceMappingURL=error-boundary.js.map