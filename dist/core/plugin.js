export class PluginBus {
    listeners = new Map();
    /** Emit data on a channel. All registered handlers are called synchronously. */
    emit(channel, data) {
        const handlers = this.listeners.get(channel);
        if (!handlers)
            return;
        for (const handler of handlers) {
            try {
                handler(data);
            }
            catch (err) {
                process.stderr.write(`[storm] PluginBus error on channel "${channel}": ${err.message}\n`);
            }
        }
    }
    /** Subscribe to a channel. Returns an unsubscribe function. */
    on(channel, handler) {
        let handlers = this.listeners.get(channel);
        if (!handlers) {
            handlers = new Set();
            this.listeners.set(channel, handlers);
        }
        handlers.add(handler);
        return () => {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.listeners.delete(channel);
            }
        };
    }
    /** Subscribe to a channel for a single emission only. Returns an unsubscribe function. */
    once(channel, handler) {
        const unsubscribe = this.on(channel, (data) => {
            unsubscribe();
            handler(data);
        });
        return unsubscribe;
    }
}
/** Default priority for plugins that don't specify one. */
const DEFAULT_PRIORITY = 100;
/** Lifecycle hooks, input interception, custom elements, and component prop transforms. Priority + dependency ordered. */
export class PluginManager {
    plugins = [];
    customElements = new Map();
    shortcuts = [];
    configs = new Map();
    failedPlugins = new Set();
    destroyed = false;
    /** Tracks registration order for stable sorting when priorities are equal. */
    registrationOrder = new Map();
    registrationCounter = 0;
    strictDependencies;
    comparePriority = (a, b) => {
        const priDiff = (a.priority ?? DEFAULT_PRIORITY) - (b.priority ?? DEFAULT_PRIORITY);
        if (priDiff !== 0)
            return priDiff;
        return (this.registrationOrder.get(a.name) ?? 0) - (this.registrationOrder.get(b.name) ?? 0);
    };
    /** Scope stack for scoped plugin support. */
    scopeStack = [];
    /** Inter-plugin communication bus. */
    bus = new PluginBus();
    constructor(options) {
        this.strictDependencies = options?.strictDependencies ??
            (process.env.NODE_ENV !== "production");
    }
    /**
     * Safely invoke a plugin hook. Catches and logs errors to stderr.
     * Returns false if the call threw an error.
     */
    safeCall(pluginName, hookName, fn) {
        try {
            fn();
            return true;
        }
        catch (err) {
            process.stderr.write(`[storm] Plugin "${pluginName}" error in ${hookName}: ${err.message}\n`);
            return false;
        }
    }
    /**
     * Sort the plugins array by priority and dependency order.
     * Called after each register() to maintain a consistent execution order.
     */
    sortPlugins() {
        const names = new Set(this.plugins.map((p) => p.name));
        for (const plugin of this.plugins) {
            if (plugin.dependencies) {
                for (const dep of plugin.dependencies) {
                    if (!names.has(dep)) {
                        process.stderr.write(`[storm] Plugin "${plugin.name}" depends on "${dep}" which is not registered.\n`);
                    }
                }
            }
        }
        // Attempt topological sort respecting dependencies
        const sorted = this.topologicalSort();
        if (sorted) {
            this.plugins = sorted;
        }
        else {
            // Circular dependency detected
            if (this.strictDependencies) {
                throw new Error(`[storm] Circular plugin dependency detected. Cannot resolve plugin ordering.`);
            }
            // Non-strict: fall back to priority-only sort with registration order tiebreaker
            process.stderr.write(`[storm] Circular plugin dependency detected. Falling back to priority order.\n`);
            this.plugins.sort(this.comparePriority);
        }
    }
    /**
     * Topological sort of plugins respecting both priority and dependencies.
     * Returns null if a cycle is detected.
     */
    topologicalSort() {
        const pluginMap = new Map();
        for (const p of this.plugins) {
            pluginMap.set(p.name, p);
        }
        const inDegree = new Map();
        const dependents = new Map(); // dep -> plugins that depend on it
        for (const p of this.plugins) {
            inDegree.set(p.name, 0);
            dependents.set(p.name, []);
        }
        for (const p of this.plugins) {
            if (p.dependencies) {
                for (const dep of p.dependencies) {
                    if (pluginMap.has(dep)) {
                        inDegree.set(p.name, (inDegree.get(p.name) ?? 0) + 1);
                        dependents.get(dep).push(p.name);
                    }
                }
            }
        }
        // Kahn's algorithm with priority-ordered queue
        const queue = [];
        for (const p of this.plugins) {
            if (inDegree.get(p.name) === 0) {
                queue.push(p);
            }
        }
        // Sort initial queue by priority, then registration order for stable tie-breaking
        queue.sort(this.comparePriority);
        const result = [];
        while (queue.length > 0) {
            const current = queue.shift();
            result.push(current);
            const deps = dependents.get(current.name);
            if (deps) {
                const readyPlugins = [];
                for (const depName of deps) {
                    const newDeg = (inDegree.get(depName) ?? 1) - 1;
                    inDegree.set(depName, newDeg);
                    if (newDeg === 0) {
                        const p = pluginMap.get(depName);
                        if (p)
                            readyPlugins.push(p);
                    }
                }
                // Sort newly ready plugins by priority, then registration order for stable tie-breaking
                readyPlugins.sort(this.comparePriority);
                queue.push(...readyPlugins);
                queue.sort(this.comparePriority);
            }
        }
        // If we didn't visit all plugins, there's a cycle
        if (result.length !== this.plugins.length) {
            return null;
        }
        return result;
    }
    /** Register a plugin. Calls its setup hook if a context is provided. */
    register(plugin, contextOrConfig, maybeContext) {
        if (this.plugins.some((p) => p.name === plugin.name)) {
            throw new Error(`Plugin "${plugin.name}" is already registered.`);
        }
        // register(plugin, context)         — backward compatible
        // register(plugin, config)          — new: config only (no context)
        // register(plugin, config, context) — new: config + context
        let config;
        let context;
        if (maybeContext !== undefined) {
            // Three-arg form: register(plugin, config, context)
            config = contextOrConfig;
            context = maybeContext;
        }
        else if (contextOrConfig !== undefined &&
            contextOrConfig !== null &&
            typeof contextOrConfig === "object" &&
            "registerElement" in contextOrConfig &&
            "addShortcut" in contextOrConfig &&
            "renderContext" in contextOrConfig) {
            // Two-arg form with PluginContext (backward compatible)
            context = contextOrConfig;
            config = undefined;
        }
        else {
            // Two-arg form with config (no context)
            config = contextOrConfig;
        }
        // Merge config: user-provided config overrides defaultConfig
        const mergedConfig = plugin.defaultConfig !== undefined || config !== undefined
            ? {
                ...(typeof plugin.defaultConfig === "object" && plugin.defaultConfig !== null
                    ? plugin.defaultConfig
                    : {}),
                ...(typeof config === "object" && config !== null ? config : {}),
            }
            : undefined;
        this.configs.set(plugin.name, mergedConfig);
        this.registrationOrder.set(plugin.name, this.registrationCounter++);
        this.plugins.push(plugin);
        this.sortPlugins();
        if (plugin.setup && context) {
            const pluginCtx = this.buildPluginContext(context);
            const ok = this.safeCall(plugin.name, "setup", () => {
                const result = plugin.setup(pluginCtx, mergedConfig);
                // If setup returns a promise, we can't await it here (register is sync).
                // Log a warning — callers should use setupAll() for async plugins.
                if (result && typeof result.then === "function") {
                    result.catch((err) => {
                        process.stderr.write(`[storm] Plugin "${plugin.name}" async setup error: ${err.message}\n`);
                        this.failedPlugins.add(plugin.name);
                    });
                }
            });
            if (!ok) {
                this.failedPlugins.add(plugin.name);
            }
        }
    }
    /**
     * Build a PluginContext from an external context, wiring up element registration,
     * shortcuts, and the plugin bus.
     */
    buildPluginContext(context) {
        return {
            ...context,
            bus: this.bus,
            registerElement: (tagName, handler) => {
                this.customElements.set(tagName, handler);
            },
            addShortcut: (shortcut) => {
                this.shortcuts.push(shortcut);
            },
        };
    }
    /**
     * Run all plugin setup hooks sequentially, respecting dependency order.
     * Supports async setup hooks — each is awaited before proceeding to the next.
     * Plugins whose setup has already been run (via register()) are skipped if
     * they are not in the failed set and were already initialized.
     */
    async setupAll(context) {
        const pluginCtx = this.buildPluginContext(context);
        for (const plugin of this.plugins) {
            if (this.failedPlugins.has(plugin.name))
                continue;
            if (!plugin.setup)
                continue;
            try {
                const result = plugin.setup(pluginCtx, this.configs.get(plugin.name));
                if (result && typeof result.then === "function") {
                    await result;
                }
            }
            catch (err) {
                process.stderr.write(`[storm] Plugin "${plugin.name}" error in setup: ${err.message}\n`);
                this.failedPlugins.add(plugin.name);
            }
        }
    }
    /** Unregister a plugin by name. Calls its cleanup hook. */
    unregister(name) {
        const idx = this.plugins.findIndex((p) => p.name === name);
        if (idx === -1)
            return;
        const plugin = this.plugins[idx];
        if (plugin.cleanup) {
            this.safeCall(plugin.name, "cleanup", () => {
                plugin.cleanup();
            });
        }
        this.plugins.splice(idx, 1);
        this.configs.delete(name);
        this.failedPlugins.delete(name);
        this.registrationOrder.delete(name);
    }
    getPlugin(name) {
        return this.plugins.find((p) => p.name === name);
    }
    getPluginConfig(name) {
        return this.configs.get(name);
    }
    getAll() {
        return this.plugins;
    }
    getCustomElements() {
        return this.customElements;
    }
    getShortcuts() {
        return this.shortcuts;
    }
    isPluginFailed(name) {
        return this.failedPlugins.has(name);
    }
    runBeforeRender() {
        for (const plugin of this.plugins) {
            if (this.failedPlugins.has(plugin.name))
                continue;
            if (plugin.beforeRender) {
                this.safeCall(plugin.name, "beforeRender", () => {
                    plugin.beforeRender();
                });
            }
        }
    }
    runAfterRender(info) {
        for (const plugin of this.plugins) {
            if (this.failedPlugins.has(plugin.name))
                continue;
            if (plugin.afterRender) {
                this.safeCall(plugin.name, "afterRender", () => {
                    plugin.afterRender(info);
                });
            }
        }
    }
    processKey(event) {
        let current = event;
        for (const plugin of this.plugins) {
            if (!current)
                break;
            if (this.failedPlugins.has(plugin.name))
                continue;
            if (plugin.onKey) {
                try {
                    current = plugin.onKey(current);
                }
                catch (err) {
                    process.stderr.write(`[storm] Plugin "${plugin.name}" error in onKey: ${err.message}\n`);
                    // Don't lose the event — continue with current value
                }
            }
        }
        return current;
    }
    processMouse(event) {
        let current = event;
        for (const plugin of this.plugins) {
            if (!current)
                break;
            if (this.failedPlugins.has(plugin.name))
                continue;
            if (plugin.onMouse) {
                try {
                    current = plugin.onMouse(current);
                }
                catch (err) {
                    process.stderr.write(`[storm] Plugin "${plugin.name}" error in onMouse: ${err.message}\n`);
                }
            }
        }
        return current;
    }
    /**
     * Run all cleanup hooks in reverse order (last registered, first cleaned up).
     * Each cleanup is wrapped in try/catch so one failure doesn't skip the rest.
     * Idempotent: calling runCleanup() again after the first call is a no-op.
     */
    runCleanup() {
        if (this.destroyed)
            return;
        this.destroyed = true;
        // Reverse order: last registered plugin cleans up first
        for (let i = this.plugins.length - 1; i >= 0; i--) {
            const plugin = this.plugins[i];
            if (plugin.cleanup) {
                this.safeCall(plugin.name, "cleanup", () => {
                    plugin.cleanup();
                });
            }
        }
    }
    isDestroyed() {
        return this.destroyed;
    }
    // ── Scope management ──────────────────────────────────────────────
    /**
     * Push a scope onto the scope stack. Plugins with a matching `scope`
     * will have their onComponentProps hooks active for components rendered
     * while this scope is on the stack.
     */
    pushScope(scopeId) {
        this.scopeStack.push(scopeId);
    }
    popScope() {
        this.scopeStack.pop();
    }
    /** Get the current active scope (top of stack), or undefined if none. */
    get currentScope() {
        return this.scopeStack.length > 0
            ? this.scopeStack[this.scopeStack.length - 1]
            : undefined;
    }
    // ── Plugin metadata & discovery ───────────────────────────────────
    /**
     * Get metadata for all registered plugins.
     */
    getPlugins() {
        return this.plugins.map((p) => ({
            name: p.name,
            priority: p.priority ?? DEFAULT_PRIORITY,
            failed: this.failedPlugins.has(p.name),
            config: this.configs.get(p.name),
        }));
    }
    hasPlugin(name) {
        return this.plugins.some((p) => p.name === name);
    }
    getComponentDefaults(componentName) {
        let merged = {};
        for (const plugin of this.plugins) {
            if (this.failedPlugins.has(plugin.name))
                continue;
            const defaults = plugin.componentDefaults?.[componentName];
            if (defaults) {
                merged = { ...merged, ...defaults };
            }
        }
        return merged;
    }
    applyComponentProps(componentName, props) {
        // 1. Start with merged defaults from all plugins
        const defaults = this.getComponentDefaults(componentName);
        // 2. User props override defaults
        let result = { ...defaults, ...props };
        // 3. Run each plugin's onComponentProps interceptor in order
        for (const plugin of this.plugins) {
            if (this.failedPlugins.has(plugin.name))
                continue;
            if (plugin.onComponentProps) {
                // Scope check: if the plugin has a scope, it must match one of
                // the currently active scopes in the scope stack.
                if (plugin.scope !== undefined) {
                    if (!this.scopeStack.includes(plugin.scope)) {
                        continue;
                    }
                }
                try {
                    const transformed = plugin.onComponentProps(componentName, result);
                    if (transformed !== undefined) {
                        result = transformed;
                    }
                }
                catch (err) {
                    process.stderr.write(`[storm] Plugin "${plugin.name}" error in onComponentProps: ${err.message}\n`);
                }
            }
        }
        return result;
    }
    /**
     * Notify custom element handlers of a mount event.
     * Called by the reconciler when a custom element is added to the tree.
     * @internal
     */
    notifyCustomElement(tagName, hook, fn) {
        const handler = this.customElements.get(tagName);
        if (!handler || !(hook in handler) || !handler[hook])
            return;
        try {
            fn();
        }
        catch (err) {
            process.stderr.write(`[storm] Custom element "${tagName}" error in ${hook}: ${err.message}\n`);
        }
    }
    notifyCustomElementMount(tagName, element) {
        this.notifyCustomElement(tagName, "mount", () => this.customElements.get(tagName).mount(element));
    }
    notifyCustomElementUnmount(tagName, element) {
        this.notifyCustomElement(tagName, "unmount", () => this.customElements.get(tagName).unmount(element));
    }
    notifyCustomElementUpdate(tagName, element, props) {
        this.notifyCustomElement(tagName, "update", () => this.customElements.get(tagName).update(element, props));
    }
}
//# sourceMappingURL=plugin.js.map