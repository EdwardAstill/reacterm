/**
 * Profiler registry -- module-level singleton so useProfiler() can
 * access the active profiler without prop-drilling or context.
 *
 * Only one profiler can be active at a time per process.
 */
import type { Profiler } from "./profiler.js";
export declare function setActiveProfiler(profiler: Profiler | null): void;
export declare function getActiveProfiler(): Profiler | null;
//# sourceMappingURL=profiler-registry.d.ts.map