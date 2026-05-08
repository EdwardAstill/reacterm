# Package: src/core


## `src/core/accessibility.ts`

- `<module>` (module) — `src/core/accessibility.ts:<module>`
- `AccessibilityOptions` (class) — `accessibility.AccessibilityOptions`
- `announce` (function) — `accessibility.announce`
- `contrastRatio` (function) — `accessibility.contrastRatio`
- `detectAccessibility` (function) — `accessibility.detectAccessibility`
- `meetsContrast` (function) — `accessibility.meetsContrast`
- `parseHex` (function) — `accessibility.parseHex`
- `relativeLuminance` (function) — `accessibility.relativeLuminance`
- `sRGBtoLinear` (function) — `accessibility.sRGBtoLinear`

## `src/core/adaptive.ts`

- `<module>` (module) — `src/core/adaptive.ts:<module>`
- `AdaptiveConfig` (class) — `adaptive.AdaptiveConfig`
- `adaptiveBorder` (function) — `adaptive.adaptiveBorder`
- `adaptiveChar` (function) — `adaptive.adaptiveChar`
- `bestColorDepth` (function) — `adaptive.bestColorDepth`
- `bestImageProtocol` (function) — `adaptive.bestImageProtocol`
- `bestKeyboardProtocol` (function) — `adaptive.bestKeyboardProtocol`
- `createAdaptiveConfig` (function) — `adaptive.createAdaptiveConfig`
- `enableKittyKeyboard` (function) — `adaptive.enableKittyKeyboard`
- `enableSyncOutput` (function) — `adaptive.enableSyncOutput`

## `src/core/animation-scheduler.ts`

- `<module>` (module) — `src/core/animation-scheduler.ts:<module>`
- `AnimationScheduler` (class) — `animation-scheduler.AnimationScheduler`
- `add` (method) — `animation-scheduler.AnimationScheduler.add`
- `clearIdleTimer` (method) — `animation-scheduler.AnimationScheduler.clearIdleTimer`
- `constructor` (method) — `animation-scheduler.AnimationScheduler.constructor`
- `count` (method) — `animation-scheduler.AnimationScheduler.count`
- `destroy` (method) — `animation-scheduler.AnimationScheduler.destroy`
- `ensureRunning` (method) — `animation-scheduler.AnimationScheduler.ensureRunning`
- `setRenderTrigger` (method) — `animation-scheduler.AnimationScheduler.setRenderTrigger`
- `startIdleTimer` (method) — `animation-scheduler.AnimationScheduler.startIdleTimer`
- `stop` (method) — `animation-scheduler.AnimationScheduler.stop`

## `src/core/ansi.ts`

- `<module>` (module) — `src/core/ansi.ts:<module>`
- `ALT_SCREEN_ENTER` (constant) — `ansi.ALT_SCREEN_ENTER`
- `ALT_SCREEN_EXIT` (constant) — `ansi.ALT_SCREEN_EXIT`
- `BRACKETED_PASTE_DISABLE` (constant) — `ansi.BRACKETED_PASTE_DISABLE`
- `BRACKETED_PASTE_ENABLE` (constant) — `ansi.BRACKETED_PASTE_ENABLE`
- `CLEAR_DOWN` (constant) — `ansi.CLEAR_DOWN`
- `CLEAR_LINE` (constant) — `ansi.CLEAR_LINE`
- `CLEAR_LINE_LEFT` (constant) — `ansi.CLEAR_LINE_LEFT`
- `CLEAR_LINE_RIGHT` (constant) — `ansi.CLEAR_LINE_RIGHT`
- `CLEAR_SCREEN` (constant) — `ansi.CLEAR_SCREEN`
- `CSI` (constant) — `ansi.CSI`
- `CURSOR_HIDE` (constant) — `ansi.CURSOR_HIDE`
- `CURSOR_RESTORE` (constant) — `ansi.CURSOR_RESTORE`
- `CURSOR_SAVE` (constant) — `ansi.CURSOR_SAVE`
- `CURSOR_SHOW` (constant) — `ansi.CURSOR_SHOW`
- `ESC` (constant) — `ansi.ESC`
- `FOCUS_DISABLE` (constant) — `ansi.FOCUS_DISABLE`
- `FOCUS_ENABLE` (constant) — `ansi.FOCUS_ENABLE`
- `FOCUS_IN` (constant) — `ansi.FOCUS_IN`
- `FOCUS_OUT` (constant) — `ansi.FOCUS_OUT`
- `MOUSE_DISABLE` (constant) — `ansi.MOUSE_DISABLE`
- `MOUSE_DISABLE_ALL` (constant) — `ansi.MOUSE_DISABLE_ALL`
- `MOUSE_ENABLE` (constant) — `ansi.MOUSE_ENABLE`
- `MOUSE_ENABLE_ALL` (constant) — `ansi.MOUSE_ENABLE_ALL`
- `PASTE_END` (constant) — `ansi.PASTE_END`
- `PASTE_START` (constant) — `ansi.PASTE_START`
- `RESET` (constant) — `ansi.RESET`
- `RESET_SCROLL_REGION` (constant) — `ansi.RESET_SCROLL_REGION`
- `SCROLL_DOWN` (constant) — `ansi.SCROLL_DOWN`
- `SCROLL_UP` (constant) — `ansi.SCROLL_UP`
- `SYNC_END` (constant) — `ansi.SYNC_END`
- `SYNC_START` (constant) — `ansi.SYNC_START`
- `_bgColorInner` (function) — `ansi._bgColorInner`
- `_cacheSet` (function) — `ansi._cacheSet`
- `_colorInner` (function) — `ansi._colorInner`
- `_fgColorInner` (function) — `ansi._fgColorInner`
- `bgColor` (function) — `ansi.bgColor`
- `cursorBack` (function) — `ansi.cursorBack`
- `cursorDown` (function) — `ansi.cursorDown`
- `cursorForward` (function) — `ansi.cursorForward`
- `cursorTo` (function) — `ansi.cursorTo`
- `cursorUp` (function) — `ansi.cursorUp`
- `diffSgr` (function) — `ansi.diffSgr`
- `fgColor` (function) — `ansi.fgColor`
- `fullSgr` (function) — `ansi.fullSgr`
- `getColorDepth` (function) — `ansi.getColorDepth`
- `rgbTo16` (function) — `ansi.rgbTo16`
- `rgbTo16FromPalette256` (function) — `ansi.rgbTo16FromPalette256`
- `rgbTo256` (function) — `ansi.rgbTo256`
- `scrollDownN` (function) — `ansi.scrollDownN`
- `scrollUpN` (function) — `ansi.scrollUpN`
- `setColorDepth` (function) — `ansi.setColorDepth`
- `setScrollRegion` (function) — `ansi.setScrollRegion`
- `sgrAttrs` (function) — `ansi.sgrAttrs`

## `src/core/aria.ts`

- `<module>` (module) — `src/core/aria.ts:<module>`
- `AriaProps` (class) — `aria.AriaProps`
- `ariaToAnnouncement` (function) — `aria.ariaToAnnouncement`
- `describeAlert` (function) — `aria.describeAlert`
- `describeButton` (function) — `aria.describeButton`
- `describeCheckbox` (function) — `aria.describeCheckbox`
- `describeDialog` (function) — `aria.describeDialog`
- `describeListItem` (function) — `aria.describeListItem`
- `describeMenuItem` (function) — `aria.describeMenuItem`
- `describeProgressBar` (function) — `aria.describeProgressBar`
- `describeTab` (function) — `aria.describeTab`
- `describeTextInput` (function) — `aria.describeTextInput`
- `describeTreeItem` (function) — `aria.describeTreeItem`

## `src/core/backpressure.ts`

- `<module>` (module) — `src/core/backpressure.ts:<module>`
- `BackpressureOptions` (class) — `backpressure.BackpressureOptions`
- `OutputBuffer` (class) — `backpressure.OutputBuffer`
- `bufferedSize` (method) — `backpressure.OutputBuffer.bufferedSize`
- `constructor` (method) — `backpressure.OutputBuffer.constructor`
- `drainPending` (method) — `backpressure.OutputBuffer.drainPending`
- `enqueue` (method) — `backpressure.OutputBuffer.enqueue`
- `flush` (method) — `backpressure.OutputBuffer.flush`
- `isReady` (method) — `backpressure.OutputBuffer.isReady`
- `write` (method) — `backpressure.OutputBuffer.write`

## `src/core/buffer.ts`

- `<module>` (module) — `src/core/buffer.ts:<module>`
- `ScreenBuffer` (class) — `buffer.ScreenBuffer`
- `WIDE_CHAR_PLACEHOLDER` (constant) — `buffer.WIDE_CHAR_PLACEHOLDER`
- `blit` (method) — `buffer.ScreenBuffer.blit`
- `clear` (method) — `buffer.ScreenBuffer.clear`
- `clearPaintedRows` (method) — `buffer.ScreenBuffer.clearPaintedRows`
- `clone` (method) — `buffer.ScreenBuffer.clone`
- `constructor` (method) — `buffer.ScreenBuffer.constructor`
- `copyFrom` (method) — `buffer.ScreenBuffer.copyFrom`
- `copyRowsFrom` (method) — `buffer.ScreenBuffer.copyRowsFrom`
- `equals` (method) — `buffer.ScreenBuffer.equals`
- `expandDamage` (method) — `buffer.ScreenBuffer.expandDamage`
- `fill` (method) — `buffer.ScreenBuffer.fill`
- `getAttrs` (method) — `buffer.ScreenBuffer.getAttrs`
- `getBg` (method) — `buffer.ScreenBuffer.getBg`
- `getCell` (method) — `buffer.ScreenBuffer.getCell`
- `getChar` (method) — `buffer.ScreenBuffer.getChar`
- `getCode` (method) — `buffer.ScreenBuffer.getCode`
- `getDamageRect` (method) — `buffer.ScreenBuffer.getDamageRect`
- `getFg` (method) — `buffer.ScreenBuffer.getFg`
- `getRowDamage` (method) — `buffer.ScreenBuffer.getRowDamage`
- `getRowRaw` (method) — `buffer.ScreenBuffer.getRowRaw`
- `getUlColor` (method) — `buffer.ScreenBuffer.getUlColor`
- `isRowDamaged` (method) — `buffer.ScreenBuffer.isRowDamaged`
- `resetPaintTracking` (method) — `buffer.ScreenBuffer.resetPaintTracking`
- `resize` (method) — `buffer.ScreenBuffer.resize`
- `rowEquals` (method) — `buffer.ScreenBuffer.rowEquals`
- `setCell` (method) — `buffer.ScreenBuffer.setCell`
- `setCellDirect` (method) — `buffer.ScreenBuffer.setCellDirect`
- `wasRowPainted` (method) — `buffer.ScreenBuffer.wasRowPainted`
- `writeString` (method) — `buffer.ScreenBuffer.writeString`

## `src/core/diff.ts`

- `<module>` (module) — `src/core/diff.ts:<module>`
- `CellRun` (class) — `diff.CellRun`
- `DiffRenderer` (class) — `diff.DiffRenderer`
- `DiffResult` (class) — `diff.DiffResult`
- `constructor` (method) — `diff.DiffRenderer.constructor`
- `formatCell` (method) — `diff.DiffRenderer.formatCell`
- `invalidate` (method) — `diff.DiffRenderer.invalidate`
- `isWasmAccelerated` (function) — `diff.isWasmAccelerated`
- `lineFullWidth` (method) — `diff.DiffRenderer.lineFullWidth`
- `render` (method) — `diff.DiffRenderer.render`
- `renderChangedCells` (method) — `diff.DiffRenderer.renderChangedCells`
- `renderLine` (method) — `diff.DiffRenderer.renderLine`
- `resize` (method) — `diff.DiffRenderer.resize`
- `setCursorVisible` (method) — `diff.DiffRenderer.setCursorVisible`
- `setDebugRainbow` (method) — `diff.DiffRenderer.setDebugRainbow`
- `swapPrevBuffer` (method) — `diff.DiffRenderer.swapPrevBuffer`
- `tryScrollRegion` (method) — `diff.DiffRenderer.tryScrollRegion`

## `src/core/easing.ts`

- `<module>` (module) — `src/core/easing.ts:<module>`
- `ease` (constant) — `easing.ease`
- `spring` (function) — `easing.spring`

## `src/core/error-boundary.ts`

- `<module>` (module) — `src/core/error-boundary.ts:<module>`
- `ErrorBoundaryOptions` (class) — `error-boundary.ErrorBoundaryOptions`
- `RenderError` (class) — `error-boundary.RenderError`
- `RenderErrorBoundary` (class) — `error-boundary.RenderErrorBoundary`
- `constructor` (method) — `error-boundary.RenderErrorBoundary.constructor`
- `formatError` (method) — `error-boundary.RenderErrorBoundary.formatError`
- `getErrors` (method) — `error-boundary.RenderErrorBoundary.getErrors`
- `protect` (method) — `error-boundary.RenderErrorBoundary.protect`
- `recordError` (method) — `error-boundary.RenderErrorBoundary.recordError`
- `resetCount` (method) — `error-boundary.RenderErrorBoundary.resetCount`
- `shouldExit` (method) — `error-boundary.RenderErrorBoundary.shouldExit`

## `src/core/focus.ts`

- `<module>` (module) — `src/core/focus.ts:<module>`
- `FocusManager` (class) — `focus.FocusManager`
- `FocusRingStyle` (class) — `focus.FocusRingStyle`
- `FocusableEntry` (class) — `focus.FocusableEntry`
- `activeGroup` (method) — `focus.FocusManager.activeGroup`
- `activeScrollId` (method) — `focus.FocusManager.activeScrollId`
- `cycleNext` (method) — `focus.FocusManager.cycleNext`
- `cyclePrev` (method) — `focus.FocusManager.cyclePrev`
- `disableFocus` (method) — `focus.FocusManager.disableFocus`
- `enableFocus` (method) — `focus.FocusManager.enableFocus`
- `focus` (method) — `focus.FocusManager.focus`
- `focusRingMode` (method) — `focus.FocusManager.focusRingMode`
- `focused` (method) — `focus.FocusManager.focused`
- `getFocusRingStyle` (method) — `focus.FocusManager.getFocusRingStyle`
- `getFocusedEntry` (method) — `focus.FocusManager.getFocusedEntry`
- `handleTabKey` (method) — `focus.FocusManager.handleTabKey`
- `hitTestInput` (method) — `focus.FocusManager.hitTestInput`
- `hitTestScroll` (method) — `focus.FocusManager.hitTestScroll`
- `isFocusEnabled` (method) — `focus.FocusManager.isFocusEnabled`
- `isFocused` (method) — `focus.FocusManager.isFocused`
- `isTrapped` (method) — `focus.FocusManager.isTrapped`
- `notify` (method) — `focus.FocusManager.notify`
- `notifyFocusChange` (method) — `focus.FocusManager.notifyFocusChange`
- `onChange` (method) — `focus.FocusManager.onChange`
- `onFocusChange` (method) — `focus.FocusManager.onFocusChange`
- `popScope` (method) — `focus.FocusManager.popScope`
- `pushScope` (method) — `focus.FocusManager.pushScope`
- `register` (method) — `focus.FocusManager.register`
- `releaseFocus` (method) — `focus.FocusManager.releaseFocus`
- `setActiveScroll` (method) — `focus.FocusManager.setActiveScroll`
- `setFocusRingStyle` (method) — `focus.FocusManager.setFocusRingStyle`
- `sortedInputs` (method) — `focus.FocusManager.sortedInputs`
- `tickRenderCycle` (method) — `focus.FocusManager.tickRenderCycle`
- `trapFocus` (method) — `focus.FocusManager.trapFocus`
- `unregister` (method) — `focus.FocusManager.unregister`
- `updateBounds` (method) — `focus.FocusManager.updateBounds`

## `src/core/guards.ts`

- `<module>` (module) — `src/core/guards.ts:<module>`
- `MAX_BUFFER_HEIGHT` (constant) — `guards.MAX_BUFFER_HEIGHT`
- `MAX_BUFFER_WIDTH` (constant) — `guards.MAX_BUFFER_WIDTH`
- `MAX_CHILDREN` (constant) — `guards.MAX_CHILDREN`
- `MAX_LAYOUT_DEPTH` (constant) — `guards.MAX_LAYOUT_DEPTH`
- `clampDimension` (function) — `guards.clampDimension`
- `isTerminalAlive` (function) — `guards.isTerminalAlive`
- `validateLayoutProps` (function) — `guards.validateLayoutProps`

## `src/core/i18n.ts`

- `<module>` (module) — `src/core/i18n.ts:<module>`
- `EN` (constant) — `i18n.EN`
- `Locale` (class) — `i18n.Locale`
- `LocaleContext` (constant) — `i18n.LocaleContext`
- `LocaleProvider` (function) — `i18n.LocaleProvider`
- `NumberFormat` (class) — `i18n.NumberFormat`
- `PLURAL_AR` (constant) — `i18n.PLURAL_AR`
- `PLURAL_EN` (constant) — `i18n.PLURAL_EN`
- `PLURAL_FR` (constant) — `i18n.PLURAL_FR`
- `PLURAL_JA` (constant) — `i18n.PLURAL_JA`
- `PLURAL_RU` (constant) — `i18n.PLURAL_RU`
- `PluralRule` (class) — `i18n.PluralRule`
- `formatNumber` (function) — `i18n.formatNumber`
- `getLocale` (function) — `i18n.getLocale`
- `getRegisteredLocales` (function) — `i18n.getRegisteredLocales`
- `plural` (function) — `i18n.plural`
- `registerLocale` (function) — `i18n.registerLocale`
- `t` (function) — `i18n.t`
- `useLocaleContext` (function) — `i18n.useLocaleContext`

## `src/core/measurement.ts`

- `<module>` (module) — `src/core/measurement.ts:<module>`
- `getBoundingBox` (function) — `measurement.getBoundingBox`
- `getHeight` (function) — `measurement.getHeight`
- `getWidth` (function) — `measurement.getWidth`
- `hitTest` (function) — `measurement.hitTest`

## `src/core/middleware.ts`

- `<module>` (module) — `src/core/middleware.ts:<module>`
- `MiddlewarePipeline` (class) — `middleware.MiddlewarePipeline`
- `RenderMiddleware` (class) — `middleware.RenderMiddleware`
- `darkenColor` (function) — `middleware.darkenColor`
- `debugBorderMiddleware` (function) — `middleware.debugBorderMiddleware`
- `extractRgb` (function) — `middleware.extractRgb`
- `fpsCounterMiddleware` (function) — `middleware.fpsCounterMiddleware`
- `has` (method) — `middleware.MiddlewarePipeline.has`
- `onPaint` (method) — `middleware.onPaint`
- `onPaint` (method) — `middleware.onPaint`
- `onPaint` (method) — `middleware.onPaint`
- `packRgb` (function) — `middleware.packRgb`
- `remove` (method) — `middleware.MiddlewarePipeline.remove`
- `runLayout` (method) — `middleware.MiddlewarePipeline.runLayout`
- `runOutput` (method) — `middleware.MiddlewarePipeline.runOutput`
- `runPaint` (method) — `middleware.MiddlewarePipeline.runPaint`
- `scanlineMiddleware` (function) — `middleware.scanlineMiddleware`
- `size` (method) — `middleware.MiddlewarePipeline.size`
- `sortMiddlewares` (method) — `middleware.MiddlewarePipeline.sortMiddlewares`
- `use` (method) — `middleware.MiddlewarePipeline.use`

## `src/core/personality-presets.ts`

- `<module>` (module) — `src/core/personality-presets.ts:<module>`
- `defaultPreset` (constant) — `personality-presets.defaultPreset`
- `hackerPreset` (constant) — `personality-presets.hackerPreset`
- `minimalPreset` (constant) — `personality-presets.minimalPreset`
- `playfulPreset` (constant) — `personality-presets.playfulPreset`

## `src/core/personality.ts`

- `<module>` (module) — `src/core/personality.ts:<module>`
- `PersonalityProvider` (function) — `personality.PersonalityProvider`
- `StormPersonality` (class) — `personality.StormPersonality`
- `createPersonality` (function) — `personality.createPersonality`
- `defaultPersonality` (constant) — `personality.defaultPersonality`
- `mergePersonality` (function) — `personality.mergePersonality`
- `usePersonality` (function) — `personality.usePersonality`

## `src/core/plugin.ts`

- `<module>` (module) — `src/core/plugin.ts:<module>`
- `CustomElementHandler` (class) — `plugin.CustomElementHandler`
- `PluginBus` (class) — `plugin.PluginBus`
- `PluginContext` (class) — `plugin.PluginContext`
- `PluginManager` (class) — `plugin.PluginManager`
- `PluginManagerOptions` (class) — `plugin.PluginManagerOptions`
- `Shortcut` (class) — `plugin.Shortcut`
- `StormPlugin` (class) — `plugin.StormPlugin`
- `applyComponentProps` (method) — `plugin.PluginManager.applyComponentProps`
- `buildPluginContext` (method) — `plugin.PluginManager.buildPluginContext`
- `constructor` (method) — `plugin.PluginManager.constructor`
- `currentScope` (method) — `plugin.PluginManager.currentScope`
- `emit` (method) — `plugin.PluginBus.emit`
- `getAll` (method) — `plugin.PluginManager.getAll`
- `getComponentDefaults` (method) — `plugin.PluginManager.getComponentDefaults`
- `getCustomElements` (method) — `plugin.PluginManager.getCustomElements`
- `getPlugin` (method) — `plugin.PluginManager.getPlugin`
- `getPluginConfig` (method) — `plugin.PluginManager.getPluginConfig`
- `getPlugins` (method) — `plugin.PluginManager.getPlugins`
- `getShortcuts` (method) — `plugin.PluginManager.getShortcuts`
- `hasPlugin` (method) — `plugin.PluginManager.hasPlugin`
- `isDestroyed` (method) — `plugin.PluginManager.isDestroyed`
- `isPluginFailed` (method) — `plugin.PluginManager.isPluginFailed`
- `notifyCustomElement` (method) — `plugin.PluginManager.notifyCustomElement`
- `notifyCustomElementMount` (method) — `plugin.PluginManager.notifyCustomElementMount`
- `notifyCustomElementUnmount` (method) — `plugin.PluginManager.notifyCustomElementUnmount`
- `notifyCustomElementUpdate` (method) — `plugin.PluginManager.notifyCustomElementUpdate`
- `on` (method) — `plugin.PluginBus.on`
- `once` (method) — `plugin.PluginBus.once`
- `popScope` (method) — `plugin.PluginManager.popScope`
- `processKey` (method) — `plugin.PluginManager.processKey`
- `processMouse` (method) — `plugin.PluginManager.processMouse`
- `pushScope` (method) — `plugin.PluginManager.pushScope`
- `register` (method) — `plugin.PluginManager.register`
- `runAfterRender` (method) — `plugin.PluginManager.runAfterRender`
- `runBeforeRender` (method) — `plugin.PluginManager.runBeforeRender`
- `runCleanup` (method) — `plugin.PluginManager.runCleanup`
- `safeCall` (method) — `plugin.PluginManager.safeCall`
- `setupAll` (method) — `plugin.PluginManager.setupAll`
- `sortPlugins` (method) — `plugin.PluginManager.sortPlugins`
- `topologicalSort` (method) — `plugin.PluginManager.topologicalSort`
- `unregister` (method) — `plugin.PluginManager.unregister`

## `src/core/render-context.ts`

- `<module>` (module) — `src/core/render-context.ts:<module>`
- `DirtyRegion` (class) — `render-context.DirtyRegion`
- `LinkRange` (class) — `render-context.LinkRange`
- `RenderContext` (class) — `render-context.RenderContext`
- `RenderMetrics` (class) — `render-context.RenderMetrics`
- `ScrollViewFrame` (class) — `render-context.ScrollViewFrame`
- `addImageRegion` (method) — `render-context.RenderContext.addImageRegion`
- `clearDirty` (method) — `render-context.RenderContext.clearDirty`
- `constructor` (method) — `render-context.RenderContext.constructor`
- `dispose` (method) — `render-context.RenderContext.dispose`
- `invalidateLayout` (method) — `render-context.RenderContext.invalidateLayout`
- `isFullyDirty` (method) — `render-context.RenderContext.isFullyDirty`
- `markDirty` (method) — `render-context.RenderContext.markDirty`
- `pruneStaleImages` (method) — `render-context.RenderContext.pruneStaleImages`
- `purgeStaleMeasurements` (method) — `render-context.RenderContext.purgeStaleMeasurements`
- `removeMeasure` (method) — `render-context.RenderContext.removeMeasure`
- `removeResizeObserver` (method) — `render-context.RenderContext.removeResizeObserver`
- `swapScrollStates` (method) — `render-context.RenderContext.swapScrollStates`
- `trackImageForFrame` (method) — `render-context.RenderContext.trackImageForFrame`

## `src/core/resize-observer.ts`

- `<module>` (module) — `src/core/resize-observer.ts:<module>`
- `ResizeObserver` (class) — `resize-observer.ResizeObserver`
- `ResizeObserverEntry` (class) — `resize-observer.ResizeObserverEntry`
- `_check` (method) — `resize-observer.ResizeObserver._check`
- `constructor` (method) — `resize-observer.ResizeObserver.constructor`
- `disconnect` (method) — `resize-observer.ResizeObserver.disconnect`
- `notifyResizeObservers` (function) — `resize-observer.notifyResizeObservers`
- `observe` (method) — `resize-observer.ResizeObserver.observe`
- `setResizeObserverMeasureMap` (function) — `resize-observer.setResizeObserverMeasureMap`
- `unobserve` (method) — `resize-observer.ResizeObserver.unobserve`

## `src/core/screen.ts`

- `<module>` (module) — `src/core/screen.ts:<module>`
- `Screen` (class) — `screen.Screen`
- `ScreenOptions` (class) — `screen.ScreenOptions`
- `cleanup` (method) — `screen.Screen.cleanup`
- `commitAbove` (method) — `screen.Screen.commitAbove`
- `constructor` (method) — `screen.Screen.constructor`
- `createBuffer` (method) — `screen.Screen.createBuffer`
- `flush` (method) — `screen.Screen.flush`
- `getBuffer` (method) — `screen.Screen.getBuffer`
- `height` (method) — `screen.Screen.height`
- `invalidate` (method) — `screen.Screen.invalidate`
- `isActive` (method) — `screen.Screen.isActive`
- `liveHeight` (method) — `screen.Screen.liveHeight`
- `onResizeEvent` (method) — `screen.Screen.onResizeEvent`
- `runBeforeCleanup` (method) — `screen.Screen.runBeforeCleanup`
- `setBeforeCleanup` (method) — `screen.Screen.setBeforeCleanup`
- `setCursor` (method) — `screen.Screen.setCursor`
- `setCursorVisible` (method) — `screen.Screen.setCursorVisible`
- `setDebugRainbow` (method) — `screen.Screen.setDebugRainbow`
- `setLiveHeight` (method) — `screen.Screen.setLiveHeight`
- `setOutputTransform` (method) — `screen.Screen.setOutputTransform`
- `setTerminalBg` (method) — `screen.Screen.setTerminalBg`
- `start` (method) — `screen.Screen.start`
- `stop` (method) — `screen.Screen.stop`
- `width` (method) — `screen.Screen.width`
- `write` (method) — `screen.Screen.write`

## `src/core/style-provider.ts`

- `<module>` (module) — `src/core/style-provider.ts:<module>`
- `StyleContext` (constant) — `style-provider.StyleContext`
- `StyleProvider` (function) — `style-provider.StyleProvider`
- `StyleProviderProps` (class) — `style-provider.StyleProviderProps`
- `useStyles` (function) — `style-provider.useStyles`

## `src/core/stylesheet-loader.ts`

- `<module>` (module) — `src/core/stylesheet-loader.ts:<module>`
- `ParsedStyleSheet` (class) — `stylesheet-loader.ParsedStyleSheet`
- `RawBlock` (class) — `stylesheet-loader.RawBlock`
- `StyleRule` (class) — `stylesheet-loader.StyleRule`
- `StyleSheetLoaderOptions` (class) — `stylesheet-loader.StyleSheetLoaderOptions`
- `createStyleSheetLoader` (function) — `stylesheet-loader.createStyleSheetLoader`
- `defaultWatch` (function) — `stylesheet-loader.defaultWatch`
- `parseBlockDeclarations` (function) — `stylesheet-loader.parseBlockDeclarations`
- `parseFile` (function) — `stylesheet-loader.parseFile`
- `parseStormCSS` (function) — `stylesheet-loader.parseStormCSS`
- `parseStormJSON` (function) — `stylesheet-loader.parseStormJSON`
- `parseValue` (function) — `stylesheet-loader.parseValue`
- `resolveVar` (function) — `stylesheet-loader.resolveVar`

## `src/core/stylesheet.ts`

- `<module>` (module) — `src/core/stylesheet.ts:<module>`
- `AncestorInfo` (class) — `stylesheet.AncestorInfo`
- `CompiledRule` (class) — `stylesheet.CompiledRule`
- `ParsedSelector` (class) — `stylesheet.ParsedSelector`
- `SelectorSegment` (class) — `stylesheet.SelectorSegment`
- `StyleRule` (class) — `stylesheet.StyleRule`
- `StyleSheet` (class) — `stylesheet.StyleSheet`
- `add` (method) — `stylesheet.StyleSheet.add`
- `addAll` (method) — `stylesheet.StyleSheet.addAll`
- `computeSpecificity` (function) — `stylesheet.computeSpecificity`
- `constructor` (method) — `stylesheet.StyleSheet.constructor`
- `create` (method) — `stylesheet.StyleSheet.create`
- `createStyleSheet` (function) — `stylesheet.createStyleSheet`
- `mergeRules` (function) — `stylesheet.mergeRules`
- `parseAncestors` (function) — `stylesheet.parseAncestors`
- `parseSegment` (function) — `stylesheet.parseSegment`
- `parseSelector` (function) — `stylesheet.parseSelector`
- `resolve` (method) — `stylesheet.StyleSheet.resolve`
- `segmentMatches` (function) — `stylesheet.segmentMatches`
- `selectorMatches` (function) — `stylesheet.selectorMatches`

## `src/core/terminal-caps.ts`

- `<module>` (module) — `src/core/terminal-caps.ts:<module>`
- `TerminalImageCaps` (class) — `terminal-caps.TerminalImageCaps`
- `_resetImageCapsCache` (function) — `terminal-caps._resetImageCapsCache`
- `bestImageProtocolDetailed` (function) — `terminal-caps.bestImageProtocolDetailed`
- `detectImageCaps` (function) — `terminal-caps.detectImageCaps`

## `src/core/terminal-detect.ts`

- `<module>` (module) — `src/core/terminal-detect.ts:<module>`
- `KnownCaps` (class) — `terminal-detect.KnownCaps`
- `TerminalCapabilities` (class) — `terminal-detect.TerminalCapabilities`
- `detectTerminal` (function) — `terminal-detect.detectTerminal`
- `envOrEmpty` (function) — `terminal-detect.envOrEmpty`
- `inferNameFromTerm` (function) — `terminal-detect.inferNameFromTerm`
- `terminalInfo` (function) — `terminal-detect.terminalInfo`

## `src/core/types.ts`

- `<module>` (module) — `src/core/types.ts:<module>`
- `Attr` (constant) — `types.Attr`
- `BORDER_CHARS` (constant) — `types.BORDER_CHARS`
- `BorderChars` (class) — `types.BorderChars`
- `Cell` (class) — `types.Cell`
- `DEFAULT_COLOR` (constant) — `types.DEFAULT_COLOR`
- `EMPTY_CELL` (constant) — `types.EMPTY_CELL`
- `Rect` (class) — `types.Rect`
- `Style` (class) — `types.Style`
- `_cacheColor` (function) — `types._cacheColor`
- `cellEquals` (function) — `types.cellEquals`
- `isRgbColor` (function) — `types.isRgbColor`
- `makeCell` (function) — `types.makeCell`
- `parseColor` (function) — `types.parseColor`
- `rgb` (function) — `types.rgb`
- `rgbB` (function) — `types.rgbB`
- `rgbG` (function) — `types.rgbG`
- `rgbR` (function) — `types.rgbR`
- `styleToAttrs` (function) — `types.styleToAttrs`
- `styleToCellProps` (function) — `types.styleToCellProps`

## `src/core/unicode.ts`

- `<module>` (module) — `src/core/unicode.ts:<module>`
- `Grapheme` (class) — `unicode.Grapheme`
- `charWidth` (function) — `unicode.charWidth`
- `hasVS15` (function) — `unicode.hasVS15`
- `hasZWJ` (function) — `unicode.hasZWJ`
- `initBmpWidthTable` (function) — `unicode.initBmpWidthTable`
- `isAscii` (function) — `unicode.isAscii`
- `isMultiCodepointEmoji` (function) — `unicode.isMultiCodepointEmoji`
- `padEndCells` (function) — `unicode.padEndCells`
- `padStartCells` (function) — `unicode.padStartCells`
- `stringWidth` (function) — `unicode.stringWidth`

## `src/core/wasm-tokenizer.ts`

- `<module>` (module) — `src/core/wasm-tokenizer.ts:<module>`
- `Token` (class) — `wasm-tokenizer.Token`
- `ensureLoaded` (function) — `wasm-tokenizer.ensureLoaded`
- `isWasmTokenizerAvailable` (function) — `wasm-tokenizer.isWasmTokenizerAvailable`
- `wasmTokenizeLine` (function) — `wasm-tokenizer.wasmTokenizeLine`

## `src/core/web-renderer-page.ts`

- `<module>` (module) — `src/core/web-renderer-page.ts:<module>`
- `WebRendererPageOptions` (class) — `web-renderer-page.WebRendererPageOptions`
- `buildWebRendererPage` (function) — `web-renderer-page.buildWebRendererPage`

## `src/core/web-renderer.ts`

- `<module>` (module) — `src/core/web-renderer.ts:<module>`
- `CellSnapshot` (class) — `web-renderer.CellSnapshot`
- `DecodedFrame` (class) — `web-renderer.DecodedFrame`
- `WebRenderer` (class) — `web-renderer.WebRenderer`
- `WebRendererOptions` (class) — `web-renderer.WebRendererOptions`
- `WsClient` (class) — `web-renderer.WsClient`
- `buildAnsi256Palette` (function) — `web-renderer.buildAnsi256Palette`
- `clientCount` (method) — `web-renderer.WebRenderer.clientCount`
- `colorToCSS` (function) — `web-renderer.colorToCSS`
- `constructor` (method) — `web-renderer.WebRenderer.constructor`
- `decodeFrame` (function) — `web-renderer.decodeFrame`
- `encodeFrame` (function) — `web-renderer.encodeFrame`
- `handleHttp` (method) — `web-renderer.WebRenderer.handleHttp`
- `handleUpgrade` (method) — `web-renderer.WebRenderer.handleUpgrade`
- `processIncoming` (method) — `web-renderer.WebRenderer.processIncoming`
- `sendClose` (method) — `web-renderer.WebRenderer.sendClose`
- `sendFrame` (method) — `web-renderer.WebRenderer.sendFrame`
- `sendPong` (method) — `web-renderer.WebRenderer.sendPong`
- `sendText` (method) — `web-renderer.WebRenderer.sendText`
- `start` (method) — `web-renderer.WebRenderer.start`
- `stop` (method) — `web-renderer.WebRenderer.stop`
- `wsAcceptKey` (function) — `web-renderer.wsAcceptKey`
