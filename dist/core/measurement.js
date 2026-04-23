export function getBoundingBox(elementId, measureMap) {
    return measureMap.get(elementId) ?? null;
}
export function getWidth(elementId, measureMap) {
    return measureMap.get(elementId)?.width ?? null;
}
export function getHeight(elementId, measureMap) {
    return measureMap.get(elementId)?.height ?? null;
}
/** Find the smallest element containing the given screen coordinates. */
export function hitTest(x, y, measureMap) {
    let bestId = null;
    let bestArea = Infinity;
    for (const [id, layout] of measureMap) {
        if (x >= layout.x &&
            x < layout.x + layout.width &&
            y >= layout.y &&
            y < layout.y + layout.height) {
            const area = layout.width * layout.height;
            if (area < bestArea) {
                bestArea = area;
                bestId = id;
            }
        }
    }
    if (bestId === null)
        return null;
    return { elementId: bestId, x, y };
}
//# sourceMappingURL=measurement.js.map