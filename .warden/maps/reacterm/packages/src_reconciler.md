# Package: src/reconciler


## `src/reconciler/console-interceptor.ts`

- `<module>` (module) — `src/reconciler/console-interceptor.ts:<module>`
- `ConsoleInterceptor` (class) — `console-interceptor.ConsoleInterceptor`
- `ConsoleInterceptorOptions` (class) — `console-interceptor.ConsoleInterceptorOptions`
- `constructor` (method) — `console-interceptor.ConsoleInterceptor.constructor`
- `restore` (method) — `console-interceptor.ConsoleInterceptor.restore`

## `src/reconciler/frame-scheduler.ts`

- `<module>` (module) — `src/reconciler/frame-scheduler.ts:<module>`
- `FrameScheduler` (class) — `frame-scheduler.FrameScheduler`
- `FrameSchedulerOptions` (class) — `frame-scheduler.FrameSchedulerOptions`
- `beginFullPaint` (method) — `frame-scheduler.FrameScheduler.beginFullPaint`
- `cancelPending` (method) — `frame-scheduler.FrameScheduler.cancelPending`
- `checkStateUpdateFrequency` (method) — `frame-scheduler.FrameScheduler.checkStateUpdateFrequency`
- `constructor` (method) — `frame-scheduler.FrameScheduler.constructor`
- `currentFps` (method) — `frame-scheduler.FrameScheduler.currentFps`
- `frameCount` (method) — `frame-scheduler.FrameScheduler.frameCount`
- `paintGeneration` (method) — `frame-scheduler.FrameScheduler.paintGeneration`
- `recordFrame` (method) — `frame-scheduler.FrameScheduler.recordFrame`
- `scheduleFastRepaint` (method) — `frame-scheduler.FrameScheduler.scheduleFastRepaint`
- `setUnmounted` (method) — `frame-scheduler.FrameScheduler.setUnmounted`
- `unmounted` (method) — `frame-scheduler.FrameScheduler.unmounted`

## `src/reconciler/host.ts`

- `<module>` (module) — `src/reconciler/host.ts:<module>`
- `afterActiveInstanceBlur` (method) — `host.afterActiveInstanceBlur`
- `appendChild` (function) — `host.appendChild`
- `appendChildToContainer` (method) — `host.appendChildToContainer`
- `beforeActiveInstanceBlur` (method) — `host.beforeActiveInstanceBlur`
- `clearContainer` (method) — `host.clearContainer`
- `commitTextUpdate` (method) — `host.commitTextUpdate`
- `commitUpdate` (method) — `host.commitUpdate`
- `createInstance` (method) — `host.createInstance`
- `createTextInstance` (method) — `host.createTextInstance`
- `detachDeletedInstance` (method) — `host.detachDeletedInstance`
- `diffProps` (function) — `host.diffProps`
- `finalizeInitialChildren` (method) — `host.finalizeInitialChildren`
- `getChildHostContext` (method) — `host.getChildHostContext`
- `getCurrentEventPriority` (method) — `host.getCurrentEventPriority`
- `getCurrentUpdatePriority` (method) — `host.getCurrentUpdatePriority`
- `getInstanceFromNode` (method) — `host.getInstanceFromNode`
- `getInstanceFromScope` (method) — `host.getInstanceFromScope`
- `getPublicInstance` (method) — `host.getPublicInstance`
- `getRootHostContext` (method) — `host.getRootHostContext`
- `hostConfig` (constant) — `host.hostConfig`
- `insertBefore` (function) — `host.insertBefore`
- `insertInContainerBefore` (method) — `host.insertInContainerBefore`
- `maySuspendCommit` (method) — `host.maySuspendCommit`
- `notifyMountIfCustom` (function) — `host.notifyMountIfCustom`
- `notifyUnmountIfCustom` (function) — `host.notifyUnmountIfCustom`
- `preloadInstance` (method) — `host.preloadInstance`
- `prepareForCommit` (method) — `host.prepareForCommit`
- `preparePortalMount` (method) — `host.preparePortalMount`
- `prepareScopeUpdate` (method) — `host.prepareScopeUpdate`
- `prepareUpdate` (method) — `host.prepareUpdate`
- `removeChild` (function) — `host.removeChild`
- `removeChildFromContainer` (method) — `host.removeChildFromContainer`
- `requestPostPaintCallback` (method) — `host.requestPostPaintCallback`
- `resetAfterCommit` (method) — `host.resetAfterCommit`
- `resetFormInstance` (method) — `host.resetFormInstance`
- `resolveUpdatePriority` (method) — `host.resolveUpdatePriority`
- `setCurrentUpdatePriority` (method) — `host.setCurrentUpdatePriority`
- `setCustomElementLifecycleHooks` (function) — `host.setCustomElementLifecycleHooks`
- `shouldSetTextContent` (method) — `host.shouldSetTextContent`
- `startSuspendingCommit` (method) — `host.startSuspendingCommit`
- `suspendInstance` (method) — `host.suspendInstance`
- `waitForCommitToBeReady` (method) — `host.waitForCommitToBeReady`

## `src/reconciler/input-wiring.ts`

- `<module>` (module) — `src/reconciler/input-wiring.ts:<module>`
- `InputWiring` (class) — `input-wiring.InputWiring`
- `constructor` (method) — `input-wiring.InputWiring.constructor`
- `dispose` (method) — `input-wiring.InputWiring.dispose`

## `src/reconciler/react-reconciler.d.ts`

- `<module>` (module) — `src/reconciler/react-reconciler.d.ts:<module>`
- `ContinuousEventPriority` (constant) — `react-reconciler.d.ContinuousEventPriority`
- `DefaultEventPriority` (constant) — `react-reconciler.d.DefaultEventPriority`
- `DiscreteEventPriority` (constant) — `react-reconciler.d.DiscreteEventPriority`
- `HostConfig` (class) — `react-reconciler.d.HostConfig`
- `IdleEventPriority` (constant) — `react-reconciler.d.IdleEventPriority`
- `Reconciler` (class) — `react-reconciler.d.Reconciler`

## `src/reconciler/render-pipeline.ts`

- `<module>` (module) — `src/reconciler/render-pipeline.ts:<module>`
- `RenderPipeline` (class) — `render-pipeline.RenderPipeline`
- `RenderPipelineDeps` (class) — `render-pipeline.RenderPipelineDeps`
- `buildMetrics` (method) — `render-pipeline.RenderPipeline.buildMetrics`
- `clear` (method) — `render-pipeline.RenderPipeline.clear`
- `commitText` (method) — `render-pipeline.RenderPipeline.commitText`
- `constructor` (method) — `render-pipeline.RenderPipeline.constructor`
- `fastRepaint` (method) — `render-pipeline.RenderPipeline.fastRepaint`
- `flushResult` (method) — `render-pipeline.RenderPipeline.flushResult`
- `fullPaint` (method) — `render-pipeline.RenderPipeline.fullPaint`
- `handleRenderError` (method) — `render-pipeline.RenderPipeline.handleRenderError`
- `recalculateLayout` (method) — `render-pipeline.RenderPipeline.recalculateLayout`
- `scheduleFastRepaint` (method) — `render-pipeline.RenderPipeline.scheduleFastRepaint`

## `src/reconciler/render-to-string.ts`

- `<module>` (module) — `src/reconciler/render-to-string.ts:<module>`
- `RenderToStringOptions` (class) — `render-to-string.RenderToStringOptions`
- `RenderToStringResult` (class) — `render-to-string.RenderToStringResult`
- `TuiReconciler` (constant) — `render-to-string.TuiReconciler`
- `bufferToPlainLines` (function) — `render-to-string.bufferToPlainLines`
- `bufferToStyledLines` (function) — `render-to-string.bufferToStyledLines`
- `doRender` (function) — `render-to-string.doRender`
- `renderToString` (function) — `render-to-string.renderToString`
- `syncContainerUpdate` (function) — `render-to-string.syncContainerUpdate`
- `trimTrailingEmptyLines` (function) — `render-to-string.trimTrailingEmptyLines`
- `unmount` (function) — `render-to-string.unmount`

## `src/reconciler/render-types.ts`

- `<module>` (module) — `src/reconciler/render-types.ts:<module>`
- `FullRenderMetrics` (class) — `render-types.FullRenderMetrics`
- `RenderOptions` (class) — `render-types.RenderOptions`
- `TuiApp` (class) — `render-types.TuiApp`

## `src/reconciler/render.ts`

- `<module>` (module) — `src/reconciler/render.ts:<module>`
- `AutoScrollWrapper` (function) — `render.AutoScrollWrapper`
- `forceReactFlush` (function) — `render.forceReactFlush`
- `render` (function) — `render.render`
- `rerender` (function) — `render.rerender`
- `runSyncCleanups` (function) — `render.runSyncCleanups`
- `syncContainerUpdate` (function) — `render.syncContainerUpdate`
- `unmount` (function) — `render.unmount`

## `src/reconciler/renderer.ts`

- `<module>` (module) — `src/reconciler/renderer.ts:<module>`
- `BorderDimFlags` (class) — `renderer.BorderDimFlags`
- `BorderSideFlags` (class) — `renderer.BorderSideFlags`
- `ClipRect` (class) — `renderer.ClipRect`
- `MeasuredLayout` (class) — `renderer.MeasuredLayout`
- `PaintResult` (class) — `renderer.PaintResult`
- `blendBg` (function) — `renderer.blendBg`
- `blendFg` (function) — `renderer.blendFg`
- `buildLayoutTree` (function) — `renderer.buildLayoutTree`
- `cellColor` (function) — `renderer.cellColor`
- `collectElementPositions` (function) — `renderer.collectElementPositions`
- `collectOverlaysFromTree` (function) — `renderer.collectOverlaysFromTree`
- `collectStyledRuns` (function) — `renderer.collectStyledRuns`
- `collectText` (function) — `renderer.collectText`
- `extractBorderFlags` (function) — `renderer.extractBorderFlags`
- `gradientT` (function) — `renderer.gradientT`
- `hasAnyDirty` (function) — `renderer.hasAnyDirty`
- `hasAnyDirtyElement` (function) — `renderer.hasAnyDirtyElement`
- `intersectClip` (function) — `renderer.intersectClip`
- `invalidateStyledRunsCache` (function) — `renderer.invalidateStyledRunsCache`
- `isClipEmpty` (function) — `renderer.isClipEmpty`
- `lerpColor` (function) — `renderer.lerpColor`
- `paint` (function) — `renderer.paint`
- `paintBackgroundPattern` (function) — `renderer.paintBackgroundPattern`
- `paintBackgroundToBuffer` (function) — `renderer.paintBackgroundToBuffer`
- `paintBorder` (function) — `renderer.paintBorder`
- `paintBox` (function) — `renderer.paintBox`
- `paintElement` (function) — `renderer.paintElement`
- `paintHScrollbar` (function) — `renderer.paintHScrollbar`
- `paintOverlay` (function) — `renderer.paintOverlay`
- `paintScrollView` (function) — `renderer.paintScrollView`
- `paintScrollbar` (function) — `renderer.paintScrollbar`
- `paintText` (function) — `renderer.paintText`
- `paintTextInput` (function) — `renderer.paintTextInput`
- `repaint` (function) — `renderer.repaint`
- `resolveScrollbarGutter` (function) — `renderer.resolveScrollbarGutter`
- `storeMeasureLayout` (function) — `renderer.storeMeasureLayout`
- `stripAnsi` (function) — `renderer.stripAnsi`
- `wrapText` (function) — `renderer.wrapText`

## `src/reconciler/types.ts`

- `<module>` (module) — `src/reconciler/types.ts:<module>`
- `BackgroundPattern` (class) — `types.BackgroundPattern`
- `HostTextNode` (class) — `types.HostTextNode`
- `TUI_BOX` (constant) — `types.TUI_BOX`
- `TUI_OVERLAY` (constant) — `types.TUI_OVERLAY`
- `TUI_SCROLL_VIEW` (constant) — `types.TUI_SCROLL_VIEW`
- `TUI_TEXT` (constant) — `types.TUI_TEXT`
- `TUI_TEXT_INPUT` (constant) — `types.TUI_TEXT_INPUT`
- `TuiBoxProps` (class) — `types.TuiBoxProps`
- `TuiElement` (class) — `types.TuiElement`
- `TuiOverlayProps` (class) — `types.TuiOverlayProps`
- `TuiRoot` (class) — `types.TuiRoot`
- `TuiScrollViewProps` (class) — `types.TuiScrollViewProps`
- `TuiTextInputProps` (class) — `types.TuiTextInputProps`
- `TuiTextNode` (class) — `types.TuiTextNode`
- `TuiTextProps` (class) — `types.TuiTextProps`
- `createElement` (function) — `types.createElement`
- `createRoot` (function) — `types.createRoot`
- `createTextNode` (function) — `types.createTextNode`
- `extractLayoutProps` (function) — `types.extractLayoutProps`
- `isTuiElement` (function) — `types.isTuiElement`
- `isTuiTextNode` (function) — `types.isTuiTextNode`
- `text` (method) — `types.text`
- `text` (method) — `types.text`

## `src/reconciler/use-effect-patch.ts`

- `<module>` (module) — `src/reconciler/use-effect-patch.ts:<module>`
- `patchUseEffect` (function) — `use-effect-patch.patchUseEffect`
