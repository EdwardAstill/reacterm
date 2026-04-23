import { PluginManager } from "../core/plugin.js";
/**
 * Access the PluginManager from within a component.
 *
 * Returns a stable PluginManager instance that persists across renders.
 * Components can use this to register plugins, query custom elements,
 * or access plugin-provided shortcuts.
 */
export declare function usePluginManager(): PluginManager;
/**
 * Reset the default plugin manager. Useful for testing.
 * @internal
 */
export declare function _resetDefaultPluginManager(): void;
//# sourceMappingURL=usePlugin.d.ts.map