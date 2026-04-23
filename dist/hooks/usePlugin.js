import { useRef } from "react";
import { PluginManager } from "../core/plugin.js";
// Module-level default instance — shared across all components in a render tree
// when no explicit PluginManager is provided.
let defaultManager = null;
function getDefaultManager() {
    if (!defaultManager) {
        defaultManager = new PluginManager();
    }
    return defaultManager;
}
/**
 * Access the PluginManager from within a component.
 *
 * Returns a stable PluginManager instance that persists across renders.
 * Components can use this to register plugins, query custom elements,
 * or access plugin-provided shortcuts.
 */
export function usePluginManager() {
    const ref = useRef(null);
    if (!ref.current) {
        ref.current = getDefaultManager();
    }
    return ref.current;
}
/**
 * Reset the default plugin manager. Useful for testing.
 * @internal
 */
export function _resetDefaultPluginManager() {
    defaultManager = null;
}
//# sourceMappingURL=usePlugin.js.map