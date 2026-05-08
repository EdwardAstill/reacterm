# Package: src/devtools


## `src/devtools/accessibility-audit.ts`

- `<module>` (module) — `src/devtools/accessibility-audit.ts:<module>`
- `AccessibilityViolation` (class) — `accessibility-audit.AccessibilityViolation`
- `AuditOptions` (class) — `accessibility-audit.AuditOptions`
- `AuditReport` (class) — `accessibility-audit.AuditReport`
- `addPairCount` (function) — `accessibility-audit.addPairCount`
- `applyOverlay` (function) — `accessibility-audit.applyOverlay`
- `buildAnsi256Table` (function) — `accessibility-audit.buildAnsi256Table`
- `cachedContrastRatio` (function) — `accessibility-audit.cachedContrastRatio`
- `colorToHex` (function) — `accessibility-audit.colorToHex`
- `createAccessibilityAudit` (function) — `accessibility-audit.createAccessibilityAudit`
- `emptyReport` (function) — `accessibility-audit.emptyReport`
- `getReport` (method) — `accessibility-audit.getReport`
- `getViolations` (method) — `accessibility-audit.getViolations`
- `isActive` (method) — `accessibility-audit.isActive`
- `onPaint` (method) — `accessibility-audit.onPaint`
- `scanBuffer` (function) — `accessibility-audit.scanBuffer`
- `toggle` (method) — `accessibility-audit.toggle`

## `src/devtools/crash-log.ts`

- `<module>` (module) — `src/devtools/crash-log.ts:<module>`
- `CrashLogData` (class) — `crash-log.CrashLogData`
- `CrashLogOptions` (class) — `crash-log.CrashLogOptions`
- `buildCrashData` (function) — `crash-log.buildCrashData`
- `enableCrashLog` (function) — `crash-log.enableCrashLog`
- `writeCrashLog` (function) — `crash-log.writeCrashLog`

## `src/devtools/devtools-overlay.ts`

- `<module>` (module) — `src/devtools/devtools-overlay.ts:<module>`
- `DevToolsOverlayOptions` (class) — `devtools-overlay.DevToolsOverlayOptions`
- `TreeEntry` (class) — `devtools-overlay.TreeEntry`
- `buildTreeEntries` (function) — `devtools-overlay.buildTreeEntries`
- `collectTreeEntry` (function) — `devtools-overlay.collectTreeEntry`
- `createDevToolsOverlay` (function) — `devtools-overlay.createDevToolsOverlay`
- `drawChrome` (function) — `devtools-overlay.drawChrome`
- `drawEventsPanel` (function) — `devtools-overlay.drawEventsPanel`
- `drawPerfPanel` (function) — `devtools-overlay.drawPerfPanel`
- `drawSelectionHighlight` (function) — `devtools-overlay.drawSelectionHighlight`
- `drawStylesPanel` (function) — `devtools-overlay.drawStylesPanel`
- `drawTreePanel` (function) — `devtools-overlay.drawTreePanel`
- `fillRegion` (function) — `devtools-overlay.fillRegion`
- `fillRow` (function) — `devtools-overlay.fillRow`
- `getPanel` (method) — `devtools-overlay.getPanel`
- `isVisible` (method) — `devtools-overlay.isVisible`
- `onPaint` (method) — `devtools-overlay.onPaint`
- `selectNext` (method) — `devtools-overlay.selectNext`
- `selectNextPanel` (method) — `devtools-overlay.selectNextPanel`
- `selectPrev` (method) — `devtools-overlay.selectPrev`
- `selectPrevPanel` (method) — `devtools-overlay.selectPrevPanel`
- `setEvents` (method) — `devtools-overlay.setEvents`
- `setMetrics` (method) — `devtools-overlay.setMetrics`
- `setPanel` (method) — `devtools-overlay.setPanel`
- `setRoot` (method) — `devtools-overlay.setRoot`
- `toggle` (method) — `devtools-overlay.toggle`
- `toggleCollapse` (method) — `devtools-overlay.toggleCollapse`
- `writeStr` (function) — `devtools-overlay.writeStr`

## `src/devtools/enable.ts`

- `<module>` (module) — `src/devtools/enable.ts:<module>`
- `DevToolsHandle` (class) — `enable.DevToolsHandle`
- `EnableDevToolsOptions` (class) — `enable.EnableDevToolsOptions`
- `destroy` (method) — `enable.destroy`
- `enableDevTools` (function) — `enable.enableDevTools`
- `exportProfilerData` (function) — `enable.exportProfilerData`
- `formatBytes` (function) — `enable.formatBytes`
- `onLayout` (method) — `enable.onLayout`
- `onPaint` (method) — `enable.onPaint`
- `renderProfilerOverlay` (function) — `enable.renderProfilerOverlay`
- `writeCell` (function) — `enable.writeCell`

## `src/devtools/event-logger.ts`

- `<module>` (module) — `src/devtools/event-logger.ts:<module>`
- `LoggedEvent` (class) — `event-logger.LoggedEvent`
- `clear` (method) — `event-logger.clear`
- `createEventLogger` (function) — `event-logger.createEventLogger`
- `getEvents` (method) — `event-logger.getEvents`
- `log` (method) — `event-logger.log`

## `src/devtools/index.ts`

- `<module>` (module) — `src/devtools/index.ts:<module>`

## `src/devtools/inspector.ts`

- `<module>` (module) — `src/devtools/inspector.ts:<module>`
- `InspectorState` (class) — `inspector.InspectorState`
- `collectElements` (function) — `inspector.collectElements`
- `createInspectorMiddleware` (function) — `inspector.createInspectorMiddleware`
- `drawBorder` (function) — `inspector.drawBorder`
- `drawDetailPanel` (function) — `inspector.drawDetailPanel`
- `drawHLine` (function) — `inspector.drawHLine`
- `drawLabel` (function) — `inspector.drawLabel`
- `drawVLine` (function) — `inspector.drawVLine`
- `getState` (method) — `inspector.getState`
- `onPaint` (method) — `inspector.onPaint`
- `rebuildFlatList` (function) — `inspector.rebuildFlatList`
- `selectNext` (method) — `inspector.selectNext`
- `selectPrev` (method) — `inspector.selectPrev`
- `setRoot` (method) — `inspector.setRoot`
- `toggle` (method) — `inspector.toggle`

## `src/devtools/performance-monitor.ts`

- `<module>` (module) — `src/devtools/performance-monitor.ts:<module>`
- `PerformanceMetrics` (class) — `performance-monitor.PerformanceMetrics`
- `createPerformanceMonitor` (function) — `performance-monitor.createPerformanceMonitor`
- `getMetrics` (method) — `performance-monitor.getMetrics`
- `onDiffEnd` (method) — `performance-monitor.onDiffEnd`
- `onDiffStart` (method) — `performance-monitor.onDiffStart`
- `onFlushEnd` (method) — `performance-monitor.onFlushEnd`
- `onFlushStart` (method) — `performance-monitor.onFlushStart`
- `onPaintEnd` (method) — `performance-monitor.onPaintEnd`
- `onPaintStart` (method) — `performance-monitor.onPaintStart`
- `reset` (method) — `performance-monitor.reset`
- `tickFps` (function) — `performance-monitor.tickFps`

## `src/devtools/profiler-registry.ts`

- `<module>` (module) — `src/devtools/profiler-registry.ts:<module>`
- `getActiveProfiler` (function) — `profiler-registry.getActiveProfiler`
- `setActiveProfiler` (function) — `profiler-registry.setActiveProfiler`

## `src/devtools/profiler.ts`

- `<module>` (module) — `src/devtools/profiler.ts:<module>`
- `AlertEntry` (class) — `profiler.AlertEntry`
- `FrameTiming` (class) — `profiler.FrameTiming`
- `Profiler` (class) — `profiler.Profiler`
- `ProfilerAlertCallback` (class) — `profiler.ProfilerAlertCallback`
- `ProfilerSnapshot` (class) — `profiler.ProfilerSnapshot`
- `countHostElements` (function) — `profiler.countHostElements`
- `createProfiler` (function) — `profiler.createProfiler`
- `emptySnapshot` (function) — `profiler.emptySnapshot`
- `estimateGCPressure` (function) — `profiler.estimateGCPressure`
- `exportCSV` (method) — `profiler.exportCSV`
- `exportJSON` (method) — `profiler.exportJSON`
- `fireAlerts` (function) — `profiler.fireAlerts`
- `history` (method) — `profiler.history`
- `isActive` (method) — `profiler.isActive`
- `onGCPressure` (method) — `profiler.onGCPressure`
- `onHighMemory` (method) — `profiler.onHighMemory`
- `onSlowFrame` (method) — `profiler.onSlowFrame`
- `recordFrame` (method) — `profiler.recordFrame`
- `sampleMemory` (function) — `profiler.sampleMemory`
- `setRoot` (method) — `profiler.setRoot`
- `snapshot` (method) — `profiler.snapshot`
- `start` (method) — `profiler.start`
- `stop` (method) — `profiler.stop`
- `walk` (function) — `profiler.walk`

## `src/devtools/render-heatmap.ts`

- `<module>` (module) — `src/devtools/render-heatmap.ts:<module>`
- `HeatmapOptions` (class) — `render-heatmap.HeatmapOptions`
- `allocate` (function) — `render-heatmap.allocate`
- `blendColor` (function) — `render-heatmap.blendColor`
- `computeStats` (function) — `render-heatmap.computeStats`
- `createRenderHeatmap` (function) — `render-heatmap.createRenderHeatmap`
- `onPaint` (method) — `render-heatmap.onPaint`

## `src/devtools/time-travel.ts`

- `<module>` (module) — `src/devtools/time-travel.ts:<module>`
- `CircularBuffer` (class) — `time-travel.CircularBuffer`
- `FrameSnapshot` (class) — `time-travel.FrameSnapshot`
- `TimeTravelState` (class) — `time-travel.TimeTravelState`
- `captureFrame` (function) — `time-travel.captureFrame`
- `constructor` (method) — `time-travel.CircularBuffer.constructor`
- `countChangedCells` (function) — `time-travel.countChangedCells`
- `createTimeTravel` (function) — `time-travel.createTimeTravel`
- `drawStatusBar` (function) — `time-travel.drawStatusBar`
- `enter` (function) — `time-travel.enter`
- `exit` (function) — `time-travel.exit`
- `get` (method) — `time-travel.CircularBuffer.get`
- `getSnapshot` (function) — `time-travel.getSnapshot`
- `getState` (function) — `time-travel.getState`
- `goToFrame` (function) — `time-travel.goToFrame`
- `newest` (method) — `time-travel.CircularBuffer.newest`
- `nextFrame` (function) — `time-travel.nextFrame`
- `onPaint` (method) — `time-travel.onPaint`
- `prevFrame` (function) — `time-travel.prevFrame`
- `push` (method) — `time-travel.CircularBuffer.push`
- `restoreSnapshot` (function) — `time-travel.restoreSnapshot`
- `size` (method) — `time-travel.CircularBuffer.size`
- `toggle` (function) — `time-travel.toggle`

## `src/devtools/tree-view.ts`

- `<module>` (module) — `src/devtools/tree-view.ts:<module>`
- `collectText` (function) — `tree-view.collectText`
- `describeElement` (function) — `tree-view.describeElement`
- `serializeNode` (function) — `tree-view.serializeNode`
- `serializeTree` (function) — `tree-view.serializeTree`
