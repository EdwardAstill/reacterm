/**
 * useProfiler -- hook to access profiler data inside components.
 *
 * Reads the profiler from the global DevTools profiler registry.
 * Returns current snapshot, history, and derived metrics.
 * When no profiler is active, returns zero-valued defaults.
 *
 * ```tsx
 * function MyDashboard() {
 *   const { snapshot, fps, memoryMB, gcPressure } = useProfiler();
 *   return <Text>FPS: {fps} | Mem: {memoryMB.toFixed(1)}MB | GC: {(gcPressure * 100).toFixed(0)}%</Text>;
 * }
 * ```
 */
import { getActiveProfiler } from "../devtools/profiler-registry.js";
const EMPTY_SNAPSHOT = {
    timestamp: 0,
    frame: 0,
    layoutMs: 0,
    paintMs: 0,
    diffMs: 0,
    flushMs: 0,
    totalMs: 0,
    rssBytes: 0,
    heapUsedBytes: 0,
    heapTotalBytes: 0,
    externalBytes: 0,
    arrayBufferBytes: 0,
    heapDelta: 0,
    gcPressure: 0,
    bufferBytes: 0,
    cellsChanged: 0,
    totalCells: 0,
    hostElementCount: 0,
    activeTimerCount: 0,
    fps: 0,
};
export function useProfiler() {
    const profiler = getActiveProfiler();
    if (!profiler || !profiler.isActive()) {
        return {
            snapshot: EMPTY_SNAPSHOT,
            history: [],
            fps: 0,
            memoryMB: 0,
            gcPressure: 0,
            renderTimeMs: 0,
        };
    }
    const snap = profiler.snapshot();
    const hist = profiler.history(60);
    return {
        snapshot: snap,
        history: hist,
        fps: snap.fps,
        memoryMB: snap.rssBytes / (1024 * 1024),
        gcPressure: snap.gcPressure,
        renderTimeMs: snap.totalMs,
    };
}
//# sourceMappingURL=useProfiler.js.map