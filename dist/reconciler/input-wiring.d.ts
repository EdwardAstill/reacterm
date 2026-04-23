/**
 * Wires mouse scroll to hit-tested ScrollViews, Tab/Shift+Tab to focus cycling,
 * and double Ctrl+C to force-exit. Registered once at app startup, disposed on unmount.
 */
import type { InputManager } from "../input/manager.js";
import type { RenderContext } from "../core/render-context.js";
import type { PluginManager } from "../core/plugin.js";
import type { Screen } from "../core/screen.js";
export declare class InputWiring {
    private readonly input;
    private readonly screen;
    private readonly renderCtx;
    private readonly pluginManager;
    private readonly unsubScroll;
    private readonly unsubTab;
    private readonly unsubCtrlC;
    private lastCtrlC;
    constructor(input: InputManager, screen: Screen, renderCtx: RenderContext, pluginManager: PluginManager);
    /** Unsubscribe all input handlers. */
    dispose(): void;
}
//# sourceMappingURL=input-wiring.d.ts.map