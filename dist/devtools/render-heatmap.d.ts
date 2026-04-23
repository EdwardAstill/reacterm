/**
 * Render Diff Heatmap — visualizes which cells changed between frames.
 *
 * It shows a real-time overlay where:
 * - Cells that changed THIS frame glow bright (hot red/orange)
 * - Cells that changed 2-5 frames ago fade (warm yellow)
 * - Cells that changed 6-15 frames ago are cool (dim blue)
 * - Stable cells (unchanged 15+ frames) are invisible (no overlay)
 *
 * Reveals thrashing, animation hotspots, and unnecessary re-renders.
 */
import type { RenderMiddleware } from "../core/middleware.js";
export interface HeatmapOptions {
    /** How many frames before a cell is considered "cold" (default: 15) */
    cooldownFrames?: number;
    /** Opacity of the heatmap overlay 0-1 (default: 0.5) — controls how much original content shows through */
    opacity?: number;
}
export declare function createRenderHeatmap(options?: HeatmapOptions): {
    /** Middleware that tracks changes and renders the heatmap overlay */
    middleware: RenderMiddleware;
    /** Toggle heatmap visibility */
    toggle: () => void;
    /** Whether heatmap is currently visible */
    isVisible: () => boolean;
    /** Get stats: total cells, hot cells, warm cells, cold cells, stable cells */
    getStats: () => {
        total: number;
        hot: number;
        warm: number;
        cool: number;
        stable: number;
    };
    /** Reset all tracking data */
    reset: () => void;
};
//# sourceMappingURL=render-heatmap.d.ts.map