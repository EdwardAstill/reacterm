/**
 * Profiler registry -- module-level singleton so useProfiler() can
 * access the active profiler without prop-drilling or context.
 *
 * Only one profiler can be active at a time per process.
 */
let _activeProfiler = null;
export function setActiveProfiler(profiler) {
    _activeProfiler = profiler;
}
export function getActiveProfiler() {
    return _activeProfiler;
}
//# sourceMappingURL=profiler-registry.js.map