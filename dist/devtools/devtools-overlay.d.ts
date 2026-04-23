/**
 * DevTools overlay — a polished debug panel rendered at the bottom of the screen.
 *
 * Implements a multi-tab overlay as a render middleware, painting directly
 * into the ScreenBuffer after normal component rendering. Toggle with F12.
 *
 * Panels:
 *   [Tree]   — Collapsible element tree with type, key, and layout dimensions.
 *   [Styles] — Computed props and layout for the selected element.
 *   [Perf]   — FPS sparkline, paint/diff/flush timing, cells changed.
 *   [Events] — Ring buffer of recent input events with timestamps.
 */
import type { RenderMiddleware } from "../core/middleware.js";
import type { TuiRoot } from "../reconciler/types.js";
import type { PerformanceMetrics } from "./performance-monitor.js";
import type { LoggedEvent } from "./event-logger.js";
export type DevToolsPanel = "tree" | "styles" | "performance" | "events";
export interface DevToolsOverlayOptions {
    /** Keyboard shortcut to toggle (default: "F12") */
    toggleKey?: string;
    /** Initial panel to show */
    initialPanel?: DevToolsPanel;
    /** Panel height in rows (default: 12) */
    panelHeight?: number;
}
/**
 * Creates a DevTools overlay middleware that renders a debug panel.
 *
 * Panels: component tree, style inspector, performance metrics, event log. Toggle with F12.
 */
export declare function createDevToolsOverlay(options?: DevToolsOverlayOptions): {
    middleware: RenderMiddleware;
    setRoot: (root: TuiRoot) => void;
    toggle: () => void;
    isVisible: () => boolean;
    setPanel: (panel: DevToolsPanel) => void;
    getPanel: () => DevToolsPanel;
    selectNext: () => void;
    selectPrev: () => void;
    toggleCollapse: () => void;
    selectNextPanel: () => void;
    selectPrevPanel: () => void;
    setMetrics: (metrics: PerformanceMetrics) => void;
    setEvents: (events: readonly LoggedEvent[]) => void;
};
//# sourceMappingURL=devtools-overlay.d.ts.map