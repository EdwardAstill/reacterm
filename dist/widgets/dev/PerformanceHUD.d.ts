import React from "react";
export interface PerformanceHUDProps {
    visible?: boolean;
    /** Render time of last frame in ms */
    renderTimeMs?: number;
    /** Frames per second */
    fps?: number;
    /** Number of components rendered */
    componentCount?: number;
    /** Number of cells changed in last frame */
    cellsChanged?: number;
    /** Total cells in buffer */
    totalCells?: number;
    /** Memory usage in MB (RSS) */
    memoryMB?: number;
    /** Heap used in MB */
    heapUsedMB?: number;
    /** Heap total in MB */
    heapTotalMB?: number;
    /** GC pressure estimate (0-1) */
    gcPressure?: number;
    /** Cell buffer size in KB */
    bufferKB?: number;
    /** Number of active timers/cleanups */
    activeTimerCount?: number;
    /** Layout computation time in ms */
    layoutMs?: number;
    /** Position */
    position?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
    /** Custom render for each metric row */
    renderMetric?: (label: string, value: string, sparkline: string) => React.ReactNode;
    /** Number of history samples to keep for sparklines (default 20) */
    historySize?: number;
    /** HUD title (default "Storm HUD") */
    title?: string;
}
export declare const PerformanceHUD: React.NamedExoticComponent<PerformanceHUDProps>;
//# sourceMappingURL=PerformanceHUD.d.ts.map