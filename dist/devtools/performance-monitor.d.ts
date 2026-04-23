/**
 * Performance monitor — tracks render pipeline timing metrics.
 *
 * Hooks into the paint/diff/flush stages to measure per-frame costs.
 * Maintains a rolling FPS average over a 1-second window.
 */
export interface PerformanceMetrics {
    /** Total frames recorded. */
    frameCount: number;
    /** Duration of the last paint stage in ms. */
    lastPaintMs: number;
    /** Duration of the last diff stage in ms. */
    lastDiffMs: number;
    /** Duration of the last flush stage in ms. */
    lastFlushMs: number;
    /** Rolling average frames per second (1-second window). */
    avgFps: number;
    /** Number of cells changed in the last frame. */
    cellsChanged: number;
    /** Total cells in the buffer (width * height). */
    totalCells: number;
}
export declare function createPerformanceMonitor(): {
    onPaintStart: () => void;
    onPaintEnd: () => void;
    onDiffStart: () => void;
    onDiffEnd: () => void;
    onFlushStart: () => void;
    onFlushEnd: (cellsChanged?: number, totalCells?: number) => void;
    getMetrics: () => PerformanceMetrics;
    reset: () => void;
};
//# sourceMappingURL=performance-monitor.d.ts.map