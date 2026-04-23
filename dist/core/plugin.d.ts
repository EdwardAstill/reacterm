import type { KeyEvent, MouseEvent } from "../input/types.js";
interface Shortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    meta?: boolean;
    handler: () => void;
    label?: string;
    description?: string;
}
import type { RenderContext } from "./render-context.js";
import type { ScreenBuffer } from "./buffer.js";
import type { StormColors } from "../theme/colors.js";
export interface CustomElementHandler {
    /** Paint the custom element to the buffer. Receives the element's React props via the optional `props` parameter. */
    paint: (element: unknown, buffer: ScreenBuffer, x: number, y: number, width: number, height: number, props?: Record<string, unknown>) => void;
    /** Called when a custom element is added to the tree. */
    mount?: (element: unknown) => void;
    /** Called when a custom element is removed from the tree. */
    unmount?: (element: unknown) => void;
    /** Called when a custom element's props are updated by React reconciliation. */
    update?: (element: unknown, props: Record<string, unknown>) => void;
    /** Called on keyboard input when the custom element (or its ancestor) is focused. */
    onKey?: (event: KeyEvent) => void;
}
export declare class PluginBus {
    private listeners;
    /** Emit data on a channel. All registered handlers are called synchronously. */
    emit(channel: string, data: unknown): void;
    /** Subscribe to a channel. Returns an unsubscribe function. */
    on(channel: string, handler: (data: unknown) => void): () => void;
    /** Subscribe to a channel for a single emission only. Returns an unsubscribe function. */
    once(channel: string, handler: (data: unknown) => void): () => void;
}
export interface PluginContext {
    /** Register a custom element type. */
    registerElement: (tagName: string, handler: CustomElementHandler) => void;
    /** Add a global keyboard shortcut. */
    addShortcut: (shortcut: Shortcut) => void;
    /** Access the render context. */
    renderContext: RenderContext;
    /** Access the theme. */
    theme: StormColors;
    /** Inter-plugin communication bus. */
    bus: PluginBus;
}
export interface StormPlugin<TConfig = unknown> {
    /** Plugin name — must be unique. */
    name: string;
    /**
     * Execution priority. Lower values run first. Default: 100.
     * Plugins with equal priority run in registration order.
     */
    priority?: number;
    /**
     * Names of plugins that must run before this one.
     * If a dependency is not registered, a warning is emitted to stderr.
     * Circular dependencies fall back to priority order with a warning.
     */
    dependencies?: string[];
    /** Default configuration for this plugin. Merged with user-provided config. */
    defaultConfig?: TConfig;
    /**
     * Optional scope identifier. When set, the plugin's onComponentProps hook
     * only applies to components within a matching scope subtree.
     * When undefined, the plugin affects all components (default behavior).
     */
    scope?: string;
    /** Called when the plugin is registered. Receives merged config. May be async. */
    setup?: (context: PluginContext, config: TConfig) => void | Promise<void>;
    /** Called before each render. */
    beforeRender?: () => void;
    /** Called after each render with timing info. */
    afterRender?: (info: {
        renderTimeMs: number;
        cellsChanged: number;
    }) => void;
    /** Called on key events before they reach components. Return null to consume. */
    onKey?: (event: KeyEvent) => KeyEvent | null;
    /** Called on mouse events before they reach components. Return null to consume. */
    onMouse?: (event: MouseEvent) => MouseEvent | null;
    /** Called when app exits. */
    cleanup?: () => void;
    /**
     * Intercept and modify component props before rendering.
     * Return the modified props, or undefined to pass through unchanged.
     */
    onComponentProps?: (componentName: string, props: Record<string, unknown>) => Record<string, unknown> | undefined;
    /**
     * Register default props for specific components.
     * These are applied BEFORE user props (user props win).
     */
    componentDefaults?: Record<string, Record<string, unknown>>;
}
export interface PluginManagerOptions {
    /**
     * When true, circular dependencies throw an Error instead of warning.
     * Default: true in dev (NODE_ENV !== "production"), false in prod.
     */
    strictDependencies?: boolean;
}
/** Lifecycle hooks, input interception, custom elements, and component prop transforms. Priority + dependency ordered. */
export declare class PluginManager {
    private plugins;
    private customElements;
    private shortcuts;
    private configs;
    private failedPlugins;
    private destroyed;
    /** Tracks registration order for stable sorting when priorities are equal. */
    private registrationOrder;
    private registrationCounter;
    private readonly strictDependencies;
    private comparePriority;
    /** Scope stack for scoped plugin support. */
    private scopeStack;
    /** Inter-plugin communication bus. */
    readonly bus: PluginBus;
    constructor(options?: PluginManagerOptions);
    /**
     * Safely invoke a plugin hook. Catches and logs errors to stderr.
     * Returns false if the call threw an error.
     */
    private safeCall;
    /**
     * Sort the plugins array by priority and dependency order.
     * Called after each register() to maintain a consistent execution order.
     */
    private sortPlugins;
    /**
     * Topological sort of plugins respecting both priority and dependencies.
     * Returns null if a cycle is detected.
     */
    private topologicalSort;
    /** Register a plugin. Calls its setup hook if a context is provided. */
    register(plugin: StormPlugin, contextOrConfig?: PluginContext | unknown, maybeContext?: PluginContext): void;
    /**
     * Build a PluginContext from an external context, wiring up element registration,
     * shortcuts, and the plugin bus.
     */
    private buildPluginContext;
    /**
     * Run all plugin setup hooks sequentially, respecting dependency order.
     * Supports async setup hooks — each is awaited before proceeding to the next.
     * Plugins whose setup has already been run (via register()) are skipped if
     * they are not in the failed set and were already initialized.
     */
    setupAll(context: PluginContext): Promise<void>;
    /** Unregister a plugin by name. Calls its cleanup hook. */
    unregister(name: string): void;
    getPlugin(name: string): StormPlugin | undefined;
    getPluginConfig<T = unknown>(name: string): T | undefined;
    getAll(): readonly StormPlugin[];
    getCustomElements(): ReadonlyMap<string, CustomElementHandler>;
    getShortcuts(): readonly Shortcut[];
    isPluginFailed(name: string): boolean;
    runBeforeRender(): void;
    runAfterRender(info: {
        renderTimeMs: number;
        cellsChanged: number;
    }): void;
    processKey(event: KeyEvent): KeyEvent | null;
    processMouse(event: MouseEvent): MouseEvent | null;
    /**
     * Run all cleanup hooks in reverse order (last registered, first cleaned up).
     * Each cleanup is wrapped in try/catch so one failure doesn't skip the rest.
     * Idempotent: calling runCleanup() again after the first call is a no-op.
     */
    runCleanup(): void;
    isDestroyed(): boolean;
    /**
     * Push a scope onto the scope stack. Plugins with a matching `scope`
     * will have their onComponentProps hooks active for components rendered
     * while this scope is on the stack.
     */
    pushScope(scopeId: string): void;
    popScope(): void;
    /** Get the current active scope (top of stack), or undefined if none. */
    get currentScope(): string | undefined;
    /**
     * Get metadata for all registered plugins.
     */
    getPlugins(): Array<{
        name: string;
        priority: number;
        failed: boolean;
        config: unknown;
    }>;
    hasPlugin(name: string): boolean;
    getComponentDefaults(componentName: string): Record<string, unknown>;
    applyComponentProps<T extends Record<string, unknown>>(componentName: string, props: T): T;
    /**
     * Notify custom element handlers of a mount event.
     * Called by the reconciler when a custom element is added to the tree.
     * @internal
     */
    private notifyCustomElement;
    notifyCustomElementMount(tagName: string, element: unknown): void;
    notifyCustomElementUnmount(tagName: string, element: unknown): void;
    notifyCustomElementUpdate(tagName: string, element: unknown, props: Record<string, unknown>): void;
}
export {};
//# sourceMappingURL=plugin.d.ts.map