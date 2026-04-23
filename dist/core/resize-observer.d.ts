import type { MeasuredLayout } from "../reconciler/renderer.js";
export interface ResizeObserverEntry {
    readonly target: string;
    readonly contentRect: {
        width: number;
        height: number;
    };
}
type ResizeObserverCallback = (entries: ResizeObserverEntry[]) => void;
/** Set the current measure map for resize observers to read from. */
export declare function setResizeObserverMeasureMap(measureMap: Map<string, MeasuredLayout>, observers: Set<ResizeObserver>): void;
export declare class ResizeObserver {
    private readonly _callback;
    private readonly _observed;
    private readonly _lastSizes;
    private readonly _ownerSet;
    constructor(callback: ResizeObserverCallback, ownerSet?: Set<ResizeObserver>);
    observe(elementId: string): void;
    unobserve(elementId: string): void;
    disconnect(): void;
    /** @internal — called by notifyResizeObservers after each paint. */
    _check(measureMap: Map<string, MeasuredLayout>): void;
}
/** Called at the end of each repaint() to fire resize observers. */
export declare function notifyResizeObservers(): void;
export {};
//# sourceMappingURL=resize-observer.d.ts.map