/** The current measureMap used by notifyResizeObservers. Set by the renderer. */
let currentMeasureMap = null;
/** The current active observers set, provided by RenderContext. */
let currentObserversSet = null;
/** Set the current measure map for resize observers to read from. */
export function setResizeObserverMeasureMap(measureMap, observers) {
    currentMeasureMap = measureMap;
    currentObserversSet = observers;
}
export class ResizeObserver {
    _callback;
    _observed = new Set();
    _lastSizes = new Map();
    _ownerSet;
    constructor(callback, ownerSet) {
        this._callback = callback;
        this._ownerSet = ownerSet ?? (currentObserversSet ?? new Set());
    }
    observe(elementId) {
        this._observed.add(elementId);
        this._ownerSet.add(this);
    }
    unobserve(elementId) {
        this._observed.delete(elementId);
        this._lastSizes.delete(elementId);
        if (this._observed.size === 0) {
            this._ownerSet.delete(this);
        }
    }
    disconnect() {
        this._observed.clear();
        this._lastSizes.clear();
        this._ownerSet.delete(this);
    }
    /** @internal — called by notifyResizeObservers after each paint. */
    _check(measureMap) {
        const entries = [];
        for (const id of this._observed) {
            const layout = measureMap.get(id);
            if (!layout)
                continue;
            const last = this._lastSizes.get(id);
            if (!last || last.width !== layout.width || last.height !== layout.height) {
                this._lastSizes.set(id, { width: layout.width, height: layout.height });
                entries.push({
                    target: id,
                    contentRect: { width: layout.width, height: layout.height },
                });
            }
        }
        if (entries.length > 0) {
            this._callback(entries);
        }
    }
}
/** Called at the end of each repaint() to fire resize observers. */
export function notifyResizeObservers() {
    if (!currentMeasureMap || !currentObserversSet)
        return;
    for (const observer of currentObserversSet) {
        observer._check(currentMeasureMap);
    }
}
//# sourceMappingURL=resize-observer.js.map