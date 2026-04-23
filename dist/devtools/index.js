/**
 * DevTools — terminal-based inspector, tree viewer, performance monitor,
 * event logger, and overlay panel.
 *
 * Usage:
 * ```ts
 * import {
 *   createDevToolsOverlay,
 *   createEventLogger,
 *   createPerformanceMonitor,
 * } from "reacterm";
 *
 * const perf = createPerformanceMonitor();
 * const logger = createEventLogger();
 * const devtools = createDevToolsOverlay({ panelHeight: 14 });
 *
 * pipeline.use(devtools.middleware);
 * devtools.setRoot(root);
 * devtools.toggle(); // show overlay
 *
 * // Each frame:
 * devtools.setMetrics(perf.getMetrics());
 * devtools.setEvents(logger.getEvents());
 * ```
 */
export { createInspectorMiddleware } from "./inspector.js";
export { serializeTree } from "./tree-view.js";
export { createPerformanceMonitor } from "./performance-monitor.js";
export { createEventLogger } from "./event-logger.js";
export { createDevToolsOverlay, } from "./devtools-overlay.js";
export { createRenderHeatmap, } from "./render-heatmap.js";
export { createTimeTravel, } from "./time-travel.js";
export { createAccessibilityAudit, } from "./accessibility-audit.js";
export { enableDevTools, } from "./enable.js";
export { createProfiler, } from "./profiler.js";
export { setActiveProfiler, getActiveProfiler, } from "./profiler-registry.js";
export { enableCrashLog, } from "./crash-log.js";
//# sourceMappingURL=index.js.map