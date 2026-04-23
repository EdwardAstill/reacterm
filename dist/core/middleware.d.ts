import type { ScreenBuffer } from "./buffer.js";
export interface RenderMiddleware {
    readonly name: string;
    /** Lower values run first. Default: 100. Equal priority preserves registration order. */
    readonly priority?: number;
    onPaint?: (buffer: ScreenBuffer, width: number, height: number, shared: Map<string, unknown>) => ScreenBuffer;
    onOutput?: (output: string, shared: Map<string, unknown>) => string;
    onLayout?: (rootWidth: number, rootHeight: number) => void;
}
export declare class MiddlewarePipeline {
    private middlewares;
    private registrationOrder;
    private registrationCounter;
    readonly shared: Map<string, unknown>;
    private sortMiddlewares;
    use(mw: RenderMiddleware): void;
    remove(name: string): void;
    has(name: string): boolean;
    get size(): number;
    /** Middlewares that have thrown are skipped on subsequent frames. */
    private failed;
    runPaint(buffer: ScreenBuffer, width: number, height: number): ScreenBuffer;
    runOutput(output: string): string;
    runLayout(rootWidth: number, rootHeight: number): void;
}
/**
 * Darken a 24-bit RGB color by the given factor (0..1).
 * Factor 0.15 means "reduce brightness by 15%".
 */
export declare function darkenColor(color: number, factor: number): number;
/** Dims every other row for a CRT scanline effect. */
export declare function scanlineMiddleware(opacity?: number): RenderMiddleware;
/** FPS indicator in the top-right corner. Updates once per second. */
export declare function fpsCounterMiddleware(): RenderMiddleware;
/** 1-cell border around the screen to visualize terminal boundaries. */
export declare function debugBorderMiddleware(color?: number): RenderMiddleware;
//# sourceMappingURL=middleware.d.ts.map