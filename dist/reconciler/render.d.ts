import React from "react";
export type { FullRenderMetrics, RenderMetrics, RenderOptions, TuiApp } from "./render-types.js";
import type { RenderOptions, TuiApp } from "./render-types.js";
/**
 * Mount a React element tree into the terminal. Returns a TuiApp handle.
 * Caller MUST await `waitUntilExit()` or the process will exit immediately
 * after the event loop drains. Enters alt screen, enables raw mode, traps
 * signals -- all cleaned up on unmount.
 */
export declare function render(initialElement: React.ReactElement, options?: RenderOptions): TuiApp;
//# sourceMappingURL=render.d.ts.map