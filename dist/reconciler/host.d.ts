import Reconciler from "react-reconciler";
/** Extracted from react-reconciler's createReconciler parameter type. */
type StormHostConfig = Parameters<typeof Reconciler>[0];
type ElementLifecycleHook = (type: string, element: unknown) => void;
type ElementUpdateHook = (type: string, element: unknown, props: Record<string, unknown>) => void;
/**
 * Set callbacks for custom element mount/unmount/update lifecycle events.
 * Called by render() to connect the PluginManager's lifecycle hooks.
 * @internal
 */
export declare function setCustomElementLifecycleHooks(onMount: ElementLifecycleHook | null, onUnmount: ElementLifecycleHook | null, onUpdate?: ElementUpdateHook | null): void;
export declare const hostConfig: StormHostConfig;
export {};
//# sourceMappingURL=host.d.ts.map