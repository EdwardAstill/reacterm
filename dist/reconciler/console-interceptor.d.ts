/**
 * Monkey-patches console.log/warn/error so they don't corrupt the alt-screen buffer.
 * Without this, React dev warnings write raw text over the TUI. Restores originals on dispose.
 */
import type { Screen } from "../core/screen.js";
export interface ConsoleInterceptorOptions {
    /** When true, console.log/warn/error write through the TUI screen. */
    patchConsole?: boolean | undefined;
}
export declare class ConsoleInterceptor {
    private readonly origConsoleLog;
    private readonly origConsoleWarn;
    private readonly origConsoleError;
    readonly suppressedWarnings: string[];
    private readonly patchConsole;
    constructor(screen: Screen, options?: ConsoleInterceptorOptions);
    /** Restore original console methods and show suppressed warning count. */
    restore(): void;
}
//# sourceMappingURL=console-interceptor.d.ts.map