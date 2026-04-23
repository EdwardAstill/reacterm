import type { Screen } from "../core/screen.js";
import type { RenderContext } from "../core/render-context.js";
import type { RenderErrorBoundary } from "../core/error-boundary.js";
import type { PluginManager } from "../core/plugin.js";
import type { MiddlewarePipeline } from "../core/middleware.js";
import type { FrameScheduler } from "./frame-scheduler.js";
import type { TuiRoot } from "./types.js";
import type { RenderOptions } from "./render-types.js";
export interface RenderPipelineDeps {
    root: TuiRoot;
    screen: Screen;
    renderCtx: RenderContext;
    errorBoundary: RenderErrorBoundary;
    pluginManager: PluginManager;
    middlewarePipeline: MiddlewarePipeline;
    scheduler: FrameScheduler;
    options: RenderOptions;
    unmount: (error?: Error) => void;
}
/**
 * Owns the paint / repaint / layout-invalidation logic that was previously
 * a set of closures sharing ~15 local bindings inside render().
 */
export declare class RenderPipeline {
    private readonly root;
    private readonly screen;
    private readonly renderCtx;
    private readonly errorBoundary;
    private readonly pluginManager;
    private readonly middlewarePipeline;
    private readonly scheduler;
    private readonly options;
    private readonly unmount;
    constructor(deps: RenderPipelineDeps);
    private handleRenderError;
    private flushResult;
    private buildMetrics;
    /** Full paint — rebuilds layout + paints. For React commits (structural changes). */
    fullPaint(): void;
    /** Fast repaint — skips layout, just repaints with cached positions. For scroll/cursor. */
    fastRepaint(): void;
    scheduleFastRepaint(): void;
    commitText(text: string): void;
    clear(): void;
    recalculateLayout(): void;
}
//# sourceMappingURL=render-pipeline.d.ts.map