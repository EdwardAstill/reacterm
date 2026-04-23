/**
 * Crash log -- forensic dump on unhandled exceptions, rejections, and signals.
 *
 * Writes a synchronous JSON file containing the last N profiler snapshots,
 * the component tree, memory state, and error details. Uses writeFileSync
 * because the process is dying.
 *
 * Usage:
 * ```ts
 * const app = render(<App />);
 * const profiler = createProfiler(renderCtx);
 * profiler.start();
 * enableCrashLog(app, profiler, { dir: "./crashes" });
 * ```
 */
import type { TuiApp } from "../reconciler/render.js";
import type { Profiler, ProfilerSnapshot } from "./profiler.js";
export interface CrashLogOptions {
    /** Directory to write crash logs. Default: process.cwd() */
    dir?: string;
    /** Number of frame snapshots to include. Default: 60 */
    frames?: number;
    /** Include component tree dump. Default: true */
    includeTree?: boolean;
}
export interface CrashLogData {
    timestamp: string;
    signal?: string;
    error?: {
        message: string;
        stack?: string;
        name?: string;
    };
    lastFrames: ProfilerSnapshot[];
    memory: {
        rss: number;
        heapUsed: number;
        heapTotal: number;
        external: number;
        arrayBuffers: number;
    };
    componentTree?: string;
    terminalSize: {
        width: number;
        height: number;
    };
    nodeVersion: string;
    stormVersion: string;
}
export declare function enableCrashLog(app: TuiApp, profiler: Profiler, options?: CrashLogOptions): () => void;
//# sourceMappingURL=crash-log.d.ts.map