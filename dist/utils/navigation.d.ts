/**
 * Find the next navigable index in the given direction, wrapping around.
 *
 * @param count      Total number of items.
 * @param from       Current index to start searching from (exclusive).
 * @param direction  +1 for forward, -1 for backward.
 * @param isNavigable  Predicate returning true if the item at the given index is navigable.
 * @param fallback   Value to return when no navigable index is found. Defaults to `from`.
 * @returns The next navigable index, or `fallback` if none exists.
 */
export declare function findNextNavigable(count: number, from: number, direction: 1 | -1, isNavigable: (index: number) => boolean, fallback?: number): number;
/**
 * Compute a scroll window that keeps the active item centered when possible.
 *
 * @param total        Total number of items.
 * @param activeIndex  Index of the currently active item.
 * @param maxVisible   Maximum number of items visible at once.
 * @returns `{ start, end }` — the slice range for the visible window.
 */
export declare function computeScrollWindow(total: number, activeIndex: number, maxVisible: number): {
    start: number;
    end: number;
};
/**
 * Find the first navigable index (scanning forward from index 0).
 *
 * @param count       Total number of items.
 * @param isNavigable Predicate returning true if the item at the given index is navigable.
 * @param fallback    Value to return when no navigable index is found. Defaults to 0.
 * @returns The first navigable index, or `fallback` if none exists.
 */
export declare function findFirstNavigable(count: number, isNavigable: (index: number) => boolean, fallback?: number): number;
//# sourceMappingURL=navigation.d.ts.map