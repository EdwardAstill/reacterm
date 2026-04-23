/**
 * Monkey-patches console.log/warn/error so they don't corrupt the alt-screen buffer.
 * Without this, React dev warnings write raw text over the TUI. Restores originals on dispose.
 */
export class ConsoleInterceptor {
    origConsoleLog = console.log;
    origConsoleWarn = console.warn;
    origConsoleError = console.error;
    suppressedWarnings = [];
    patchConsole;
    constructor(screen, options = {}) {
        this.patchConsole = options.patchConsole === true;
        // Always silence console.warn/error in alt screen mode to prevent React dev
        // warnings from corrupting the TUI display. console.log is only patched if
        // patchConsole is explicitly true.
        const silentWarn = (...args) => {
            this.suppressedWarnings.push(args.map(a => typeof a === "string" ? a : String(a)).join(" "));
        };
        console.warn = silentWarn;
        console.error = silentWarn;
        if (this.patchConsole) {
            const writeThrough = (...args) => {
                const msg = args.map(a => typeof a === "string" ? a : JSON.stringify(a)).join(" ");
                screen.write(msg + "\n");
            };
            console.log = writeThrough;
            console.warn = writeThrough;
            console.error = writeThrough;
        }
    }
    /** Restore original console methods and show suppressed warning count. */
    restore() {
        console.warn = this.origConsoleWarn;
        console.error = this.origConsoleError;
        if (this.patchConsole) {
            console.log = this.origConsoleLog;
        }
        // Show any suppressed warnings after TUI exits
        if (this.suppressedWarnings.length > 0 && process.env.NODE_ENV !== "production") {
            this.origConsoleWarn(`[storm] ${this.suppressedWarnings.length} console warnings were suppressed during TUI session.`);
        }
    }
}
//# sourceMappingURL=console-interceptor.js.map