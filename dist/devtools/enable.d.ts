/**
 * One-line DevTools enablement for Storm TUI.
 *
 * ```ts
 * const app = render(<App />);
 * enableDevTools(app);
 * ```
 *
 * That's it. All DevTools features are wired up:
 *   1 — Render Diff Heatmap
 *   2 — WCAG Accessibility Audit
 *   3 — Time-Travel Debugging (left/right to scrub)
 *   4 — DevTools Overlay ([] panels, jk navigate, space toggle)
 *   5 — Profiler Memory/CPU Breakdown Overlay
 *   6 — Export profiler data to JSON file
 *
 * All overlays are non-blocking — the app keeps running underneath.
 * Input is handled via the app's InputManager — no external wiring needed.
 */
import type { TuiApp } from "../reconciler/render.js";
import { type Profiler } from "./profiler.js";
export interface EnableDevToolsOptions {
    /** Key to toggle heatmap (default: "1") */
    heatmapKey?: string;
    /** Key to toggle accessibility audit (default: "2") */
    auditKey?: string;
    /** Key to toggle time-travel (default: "3") */
    timeTravelKey?: string;
    /** Key to toggle DevTools overlay (default: "4") */
    overlayKey?: string;
    /** Key to toggle profiler overlay (default: "5") */
    profilerKey?: string;
    /** Key to export profiler JSON (default: "6") */
    exportKey?: string;
    /** DevTools panel height (default: 12) */
    panelHeight?: number;
    /** Max time-travel frames to store (default: 120) */
    maxFrames?: number;
    /** WCAG minimum contrast ratio (default: 4.5 for AA) */
    minContrast?: number;
    /** Profiler history size (default: 120 frames) */
    profilerHistory?: number;
    /** Enable crash log writing (default: true) */
    crashLog?: boolean;
    /** Crash log output directory (default: process.cwd()) */
    crashLogDir?: string;
}
export interface DevToolsHandle {
    /** Destroy all DevTools (remove middleware, input handlers) */
    destroy: () => void;
    /** Access the profiler instance directly */
    profiler: Profiler;
}
export declare function enableDevTools(app: TuiApp, options?: EnableDevToolsOptions): DevToolsHandle;
//# sourceMappingURL=enable.d.ts.map