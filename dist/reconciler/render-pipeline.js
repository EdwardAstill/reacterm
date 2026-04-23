import { paint, repaint } from "./renderer.js";
/**
 * Owns the paint / repaint / layout-invalidation logic that was previously
 * a set of closures sharing ~15 local bindings inside render().
 */
export class RenderPipeline {
    root;
    screen;
    renderCtx;
    errorBoundary;
    pluginManager;
    middlewarePipeline;
    scheduler;
    options;
    unmount;
    constructor(deps) {
        this.root = deps.root;
        this.screen = deps.screen;
        this.renderCtx = deps.renderCtx;
        this.errorBoundary = deps.errorBoundary;
        this.pluginManager = deps.pluginManager;
        this.middlewarePipeline = deps.middlewarePipeline;
        this.scheduler = deps.scheduler;
        this.options = deps.options;
        this.unmount = deps.unmount;
    }
    // ── helpers ──────────────────────────────────────────────────────
    handleRenderError(err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (this.options.onError) {
            this.options.onError(error);
        }
        else {
            process.stderr.write(`\x1b[0m\nTUI render error: ${error.stack ?? error.message}\n`);
        }
    }
    flushResult(result) {
        this.screen.setLiveHeight(this.screen.height);
        const diffResult = this.screen.flush(result.buffer, this.renderCtx.links, this.renderCtx);
        if (result.cursorX >= 0 && result.cursorY >= 0) {
            this.screen.setCursor(result.cursorX, result.cursorY);
            this.screen.setCursorVisible(true);
        }
        else {
            this.screen.setCursorVisible(false);
        }
        return diffResult;
    }
    buildMetrics(renderTime, changedLines) {
        const totalCells = this.screen.width * this.screen.height;
        const metrics = {
            renderTime,
            lineCount: this.screen.height,
            lastRenderTimeMs: renderTime,
            fps: this.scheduler.currentFps,
            cellsChanged: changedLines,
            totalCells,
            frameCount: this.scheduler.frameCount,
        };
        this.renderCtx.metrics = {
            lastRenderTimeMs: renderTime,
            fps: this.scheduler.currentFps,
            cellsChanged: changedLines,
            totalCells,
            frameCount: this.scheduler.frameCount,
        };
        return metrics;
    }
    // ── public paint methods ─────────────────────────────────────────
    /** Full paint — rebuilds layout + paints. For React commits (structural changes). */
    fullPaint() {
        if (this.scheduler.unmounted)
            return;
        this.scheduler.beginFullPaint();
        try {
            this.pluginManager.runBeforeRender();
            this.middlewarePipeline.runLayout(this.screen.width, this.screen.height);
            const t0 = performance.now();
            const result = this.errorBoundary.protect("paint", () => paint(this.root, this.screen.width, this.screen.height, this.renderCtx));
            if (result === undefined) {
                if (this.errorBoundary.shouldExit())
                    this.unmount(new Error("Too many consecutive render errors"));
                return;
            }
            result.buffer = this.middlewarePipeline.runPaint(result.buffer, this.screen.width, this.screen.height);
            const diffResult = this.flushResult(result);
            const renderTime = performance.now() - t0;
            this.scheduler.recordFrame();
            const metrics = this.buildMetrics(renderTime, diffResult.changedLines);
            this.renderCtx.clearDirty();
            this.pluginManager.runAfterRender({ renderTimeMs: renderTime, cellsChanged: diffResult.changedLines });
            this.options.onRender?.(metrics);
            this.scheduler.checkStateUpdateFrequency();
        }
        catch (err) {
            this.handleRenderError(err);
        }
    }
    /** Fast repaint — skips layout, just repaints with cached positions. For scroll/cursor. */
    fastRepaint() {
        if (this.scheduler.unmounted)
            return;
        try {
            this.pluginManager.runBeforeRender();
            const t0 = performance.now();
            const result = this.errorBoundary.protect("paint", () => repaint(this.root, this.screen.width, this.screen.height, this.renderCtx));
            if (result === undefined) {
                if (this.errorBoundary.shouldExit())
                    this.unmount(new Error("Too many consecutive render errors"));
                return;
            }
            result.buffer = this.middlewarePipeline.runPaint(result.buffer, this.screen.width, this.screen.height);
            const diffResult = this.flushResult(result);
            const renderTime = performance.now() - t0;
            this.scheduler.recordFrame();
            const metrics = this.buildMetrics(renderTime, diffResult.changedLines);
            this.renderCtx.clearDirty();
            this.pluginManager.runAfterRender({ renderTimeMs: renderTime, cellsChanged: diffResult.changedLines });
            this.options.onRender?.(metrics);
        }
        catch (err) {
            this.handleRenderError(err);
        }
    }
    // ── convenience wrappers used by the public API ──────────────────
    scheduleFastRepaint() {
        this.renderCtx._renderRequested = true;
        this.scheduler.scheduleFastRepaint(() => this.fastRepaint());
    }
    commitText(text) {
        if (this.scheduler.unmounted)
            return;
        this.screen.commitAbove(text);
        this.screen.invalidate();
        this.fullPaint();
    }
    clear() {
        this.screen.invalidate();
        this.fullPaint();
    }
    recalculateLayout() {
        this.renderCtx.invalidateLayout();
        this.fullPaint();
    }
}
//# sourceMappingURL=render-pipeline.js.map