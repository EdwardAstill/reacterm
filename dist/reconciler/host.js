import { DefaultEventPriority } from "react-reconciler/constants.js";
import { createElement, createTextNode, extractLayoutProps, } from "./types.js";
let _onCustomElementMount = null;
let _onCustomElementUnmount = null;
let _onCustomElementUpdate = null;
/**
 * Set callbacks for custom element mount/unmount/update lifecycle events.
 * Called by render() to connect the PluginManager's lifecycle hooks.
 * @internal
 */
export function setCustomElementLifecycleHooks(onMount, onUnmount, onUpdate) {
    _onCustomElementMount = onMount;
    _onCustomElementUnmount = onUnmount;
    _onCustomElementUpdate = onUpdate ?? null;
}
/** Known built-in element types — anything else is a custom element. */
const BUILTIN_TYPES = new Set(["tui-box", "tui-text", "tui-scroll-view", "tui-text-input", "tui-overlay"]);
const BOX_IN_TEXT_WARNING = "Storm TUI: <Box> cannot be nested inside <Text>. Use <Text> for styled content, <Box> for layout. Wrap text content in <Text> elements inside a <Box>.";
function notifyMountIfCustom(child) {
    if ("type" in child && child.type !== "TEXT_NODE" && !BUILTIN_TYPES.has(child.type) && _onCustomElementMount) {
        _onCustomElementMount(child.type, child);
    }
}
function notifyUnmountIfCustom(child) {
    if ("type" in child && child.type !== "TEXT_NODE" && !BUILTIN_TYPES.has(child.type) && _onCustomElementUnmount) {
        _onCustomElementUnmount(child.type, child);
    }
}
function appendChild(parent, child) {
    // Validate nesting: tui-box cannot be a child of tui-text
    if (process.env.NODE_ENV !== "production") {
        if ("type" in child && child.type === "tui-box" && "type" in parent && parent.type === "tui-text") {
            console.warn(BOX_IN_TEXT_WARNING);
        }
    }
    const children = "children" in parent ? parent.children : [];
    const existingIdx = children.indexOf(child);
    if (existingIdx >= 0)
        children.splice(existingIdx, 1);
    children.push(child);
    if ("parent" in child) {
        child.parent = "type" in parent && parent.type !== undefined
            ? parent
            : null;
    }
    if (child.type === "TEXT_NODE" && "props" in parent) {
        const ref = parent.props["_textNodeRef"];
        if (ref) {
            ref.current = child;
        }
    }
    notifyMountIfCustom(child);
}
function removeChild(parent, child) {
    if ("type" in child && child.type !== "TEXT_NODE" && !BUILTIN_TYPES.has(child.type) && _onCustomElementUnmount) {
        _onCustomElementUnmount(child.type, child);
    }
    const children = "children" in parent ? parent.children : [];
    const idx = children.indexOf(child);
    if (idx >= 0)
        children.splice(idx, 1);
    if ("parent" in child)
        child.parent = null;
}
function insertBefore(parent, child, before) {
    // Validate nesting: tui-box cannot be a child of tui-text
    if (process.env.NODE_ENV !== "production") {
        if ("type" in child && child.type === "tui-box" && "type" in parent && parent.type === "tui-text") {
            console.warn(BOX_IN_TEXT_WARNING);
        }
    }
    const children = "children" in parent ? parent.children : [];
    const existingIdx = children.indexOf(child);
    if (existingIdx >= 0)
        children.splice(existingIdx, 1);
    const idx = children.indexOf(before);
    if (idx >= 0) {
        children.splice(idx, 0, child);
    }
    else {
        children.push(child);
    }
    if ("parent" in child) {
        child.parent = "type" in parent && parent.type !== undefined
            ? parent
            : null;
    }
    notifyMountIfCustom(child);
}
function diffProps(oldProps, newProps) {
    let changed = null;
    for (const key of Object.keys(newProps)) {
        if (key === "children")
            continue;
        if (oldProps[key] !== newProps[key]) {
            changed ??= {};
            changed[key] = newProps[key];
        }
    }
    for (const key of Object.keys(oldProps)) {
        if (key === "children")
            continue;
        if (!(key in newProps)) {
            changed ??= {};
            changed[key] = undefined;
        }
    }
    return changed;
}
const LAYOUT_KEYS = [
    "width", "height", "flex", "flexGrow", "flexShrink", "flexBasis",
    "flexDirection", "flexWrap", "padding", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight",
    "paddingX", "paddingY",
    "margin", "marginTop", "marginBottom", "marginLeft", "marginRight",
    "marginX", "marginY",
    "gap", "columnGap", "rowGap", "alignItems", "alignSelf", "justifyContent",
    "overflow", "overflowX", "overflowY", "display", "position",
    "minWidth", "minHeight", "maxWidth", "maxHeight",
    "borderStyle", "borderTop", "borderBottom", "borderLeft", "borderRight",
    "top", "left", "right", "bottom",
    "aspectRatio", "order",
];
export const hostConfig = {
    // ── Feature flags ───────────────────────────────────────────────
    supportsMutation: true,
    supportsPersistence: false,
    supportsHydration: false,
    isPrimaryRenderer: true,
    noTimeout: -1,
    // ── Instance creation ───────────────────────────────────────────
    createInstance(type, props) {
        const el = createElement(type, props);
        // If the component passed a _hostPropsRef, store the element's props in it
        // so the component can imperatively mutate props (e.g., scrollTop)
        const ref = props["_hostPropsRef"];
        if (ref)
            ref.current = el.props;
        return el;
    },
    createTextInstance(text) {
        return createTextNode(text);
    },
    // ── Tree mutation ───────────────────────────────────────────────
    appendInitialChild: appendChild,
    appendChild: appendChild,
    appendChildToContainer(container, child) {
        container.children.push(child);
        if ("parent" in child)
            child.parent = null;
        notifyMountIfCustom(child);
    },
    removeChild: removeChild,
    removeChildFromContainer(container, child) {
        notifyUnmountIfCustom(child);
        const idx = container.children.indexOf(child);
        if (idx >= 0)
            container.children.splice(idx, 1);
        if ("parent" in child)
            child.parent = null;
    },
    insertBefore: insertBefore,
    insertInContainerBefore(container, child, before) {
        const idx = container.children.indexOf(before);
        if (idx >= 0) {
            container.children.splice(idx, 0, child);
        }
        else {
            container.children.push(child);
        }
        if ("parent" in child)
            child.parent = null;
        notifyMountIfCustom(child);
    },
    clearContainer(container) {
        container.children.length = 0;
    },
    // ── Updates ─────────────────────────────────────────────────────
    prepareUpdate(_instance, _type, oldProps, newProps) {
        return diffProps(oldProps, newProps);
    },
    commitUpdate(instance, _type, oldProps, newProps) {
        // React freezes props objects — never mutate, always replace
        instance.props = { ...newProps };
        if (!BUILTIN_TYPES.has(instance.type) && _onCustomElementUpdate) {
            _onCustomElementUpdate(instance.type, instance, { ...newProps });
        }
        // Invalidate styled-run cache for this instance (props changed — runs may differ)
        instance._cachedRunsVersion = undefined;
        instance._runsDirty = true;
        const ref = newProps["_hostPropsRef"];
        if (ref)
            ref.current = instance.props;
        // Sync layout-relevant props only if any layout prop actually changed
        if (instance.layoutNode) {
            let layoutChanged = false;
            for (const k of LAYOUT_KEYS) {
                if (oldProps[k] !== newProps[k]) {
                    layoutChanged = true;
                    break;
                }
            }
            if (layoutChanged) {
                // IMPORTANT: Replace the entire props object (don't mutate in place).
                // buildLayoutTree detects changes via reference equality
                // (node._prevProps !== node.props). If we mutate the same object,
                // the dirty check fails and computeLayout skips re-layout, using
                // stale cached positions. Replacing the object ensures the
                // reference changes and the node is correctly marked dirty.
                // This also removes any old keys that are no longer present
                // (e.g., switching from flex:1 to height:100).
                instance.layoutNode.props = extractLayoutProps(instance.type, newProps);
            }
        }
    },
    commitTextUpdate(textInstance, _oldText, newText) {
        // The text setter already propagates _runsDirty up through all
        // tui-text ancestors, so no extra marking needed here.
        textInstance.text = newText;
    },
    // ── Commit lifecycle ────────────────────────────────────────────
    prepareForCommit() {
        return null;
    },
    resetAfterCommit(container) {
        // THIS is where the magic happens:
        // React is done mutating the tree → trigger layout + paint + diff
        container.onCommit();
    },
    // ── Misc ────────────────────────────────────────────────────────
    finalizeInitialChildren() {
        return false;
    },
    getPublicInstance(instance) {
        return instance;
    },
    getRootHostContext() {
        return {};
    },
    getChildHostContext(parentContext) {
        return parentContext;
    },
    shouldSetTextContent() {
        return false;
    },
    preparePortalMount() {
        // no-op
    },
    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,
    getCurrentEventPriority() {
        return DefaultEventPriority;
    },
    getInstanceFromNode() {
        return null;
    },
    prepareScopeUpdate() {
        // no-op
    },
    getInstanceFromScope() {
        return null;
    },
    beforeActiveInstanceBlur() {
        // no-op
    },
    afterActiveInstanceBlur() {
        // no-op
    },
    detachDeletedInstance() {
        // no-op
    },
    requestPostPaintCallback() {
        // no-op
    },
    maySuspendCommit() {
        return false;
    },
    preloadInstance() {
        return true;
    },
    startSuspendingCommit() {
        // no-op
    },
    suspendInstance() {
        // no-op
    },
    waitForCommitToBeReady() {
        return null;
    },
    NotPendingTransition: null,
    resetFormInstance() {
        // no-op
    },
    setCurrentUpdatePriority() {
        // no-op
    },
    getCurrentUpdatePriority() {
        return DefaultEventPriority;
    },
    resolveUpdatePriority() {
        return DefaultEventPriority;
    },
};
//# sourceMappingURL=host.js.map