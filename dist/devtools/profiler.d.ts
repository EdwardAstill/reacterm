/**
 * Deep profiler -- per-frame timing, memory, GC pressure, and Storm internals.
 *
 * Designed for zero overhead when disabled. Memory is sampled every 10th frame
 * to avoid the cost of process.memoryUsage() on every tick.
 *
 * Usage:
 * ```ts
 * const profiler = createProfiler(renderCtx);
 * profiler.start();
 * // ... after each frame:
 * profiler.recordFrame({ layoutMs, paintMs, diffMs, flushMs });
 * // ... read data:
 * const snap = profiler.snapshot();
 * const csv = profiler.exportCSV();
 * ```
 */
import type { RenderContext } from "../core/render-context.js";
import type { TuiRoot } from "../reconciler/types.js";
export interface ProfilerSnapshot {
    timestamp: number;
    frame: number;
    layoutMs: number;
    paintMs: number;
    diffMs: number;
    flushMs: number;
    totalMs: number;
    rssBytes: number;
    heapUsedBytes: number;
    heapTotalBytes: number;
    externalBytes: number;
    arrayBufferBytes: number;
    heapDelta: number;
    gcPressure: number;
    bufferBytes: number;
    cellsChanged: number;
    totalCells: number;
    hostElementCount: number;
    activeTimerCount: number;
    fps: number;
}
export interface FrameTiming {
    layoutMs: number;
    paintMs: number;
    diffMs: number;
    flushMs: number;
}
export interface ProfilerAlertCallback {
    (snapshot: ProfilerSnapshot): void;
}
export interface Profiler {
    /** Start collecting profiler data. */
    start(): void;
    /** Stop collecting profiler data. */
    stop(): void;
    /** Whether the profiler is currently active. */
    isActive(): boolean;
    /** Record a frame with timing data. Called from the render loop. */
    recordFrame(timing: FrameTiming): void;
    /** Get the latest snapshot (or a zero-valued snapshot if none recorded). */
    snapshot(): ProfilerSnapshot;
    /** Get the last N snapshots (default: all in history). */
    history(n?: number): ProfilerSnapshot[];
    /** Set the element tree root for host element counting. */
    setRoot(root: TuiRoot): void;
    exportJSON(): string;
    exportCSV(): string;
    onHighMemory(thresholdMB: number, callback: ProfilerAlertCallback): () => void;
    onSlowFrame(thresholdMs: number, callback: ProfilerAlertCallback): () => void;
    onGCPressure(threshold: number, callback: ProfilerAlertCallback): () => void;
}
export declare function createProfiler(renderCtx: RenderContext, maxHistory?: number): Profiler;
//# sourceMappingURL=profiler.d.ts.map