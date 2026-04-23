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
import type { ProfilerSnapshot } from "../devtools/profiler.js";
export interface UseProfilerResult {
    /** Latest profiler snapshot. */
    snapshot: ProfilerSnapshot;
    /** Recent snapshot history. */
    history: ProfilerSnapshot[];
    /** Current frames per second. */
    fps: number;
    /** RSS memory in megabytes. */
    memoryMB: number;
    /** GC pressure estimate (0-1). */
    gcPressure: number;
    /** Total render time of last frame in ms. */
    renderTimeMs: number;
}
export declare function useProfiler(): UseProfilerResult;
//# sourceMappingURL=useProfiler.d.ts.map