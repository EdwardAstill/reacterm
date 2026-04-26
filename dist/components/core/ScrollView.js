import React, { useRef, useCallback } from "react";
import { useTui } from "../../context/TuiContext.js";
import { useCleanup } from "../../hooks/useCleanup.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
let scrollViewCounter = 0;
// Automatic windowing: when children exceed maxRenderChildren, only a window
// of children near the scroll position is rendered, with spacer elements to
// preserve total scroll height. Fully backward-compatible — no API change needed.
export const ScrollView = React.memo(function ScrollView(rawProps) {
    const props = usePluginProps("ScrollView", rawProps);
    const { children, scrollSpeed = 3, stickToBottom = false, scrollStateRef: parentScrollStateRef, onScroll, maxRenderChildren = 500, itemHeight = 1, horizontalScroll = true, snapToItem = false, ...layoutProps } = props;
    // Track whether this ScrollView is missing a height constraint (used for inline dev warning)
    let missingHeightConstraint = false;
    if (process.env.NODE_ENV !== "production") {
        if (layoutProps.height === undefined && layoutProps.flex === undefined && layoutProps.flexGrow === undefined && layoutProps.minHeight === undefined) {
            missingHeightConstraint = true;
            process.stderr.write("[storm] Warning: <ScrollView> has no height constraint (height, flex, flexGrow, or minHeight). " +
                "Content will not scroll. Add height={N} or flex={1} to enable scrolling.\n");
        }
        const childCount = React.Children.count(children);
        if (childCount > 200) {
            console.warn("Storm TUI: <ScrollView> has " + childCount + " children. Consider <VirtualList> for better performance. See docs/performance.md");
        }
    }
    const { input, focus, requestRender } = useTui();
    const scrollRef = useRef(0);
    const hScrollRef = useRef(0);
    // Initialized eagerly below — always non-null after first render
    const scrollStateRef = useRef(null);
    const hostPropsRef = useRef(null);
    const idRef = useRef(`scrollview-${scrollViewCounter++}`);
    // Initialize scrollState once — needs requestRender in closure
    if (!scrollStateRef.current) {
        scrollStateRef.current = {
            clampedTop: 0,
            maxScroll: 0,
            clampedLeft: 0,
            maxHScroll: 0,
            scrollToBottom() {
                scrollRef.current = Number.MAX_SAFE_INTEGER;
                if (scrollStateRef.current)
                    scrollStateRef.current.clampedTop = Number.MAX_SAFE_INTEGER;
                if (hostPropsRef.current)
                    hostPropsRef.current.scrollTop = Number.MAX_SAFE_INTEGER;
                requestRender();
            },
            scrollToElement(id) {
                // Walk the host element tree to find the child with _elementId === id.
                // The host props ref gives us access to the host element's props, and
                // the renderer stores measured layout bounds in _elementPositions.
                const positions = hostPropsRef.current?._elementPositions;
                if (!positions)
                    return;
                const pos = positions.get(id);
                if (!pos)
                    return;
                const state = scrollStateRef.current;
                if (!state)
                    return;
                // Vertical: ensure element is in view
                const viewportHeight = hostPropsRef.current?._viewportHeight ?? 0;
                if (pos.y < state.clampedTop) {
                    // Element is above viewport — scroll up
                    state.clampedTop = pos.y;
                }
                else if (pos.y + pos.height > state.clampedTop + viewportHeight) {
                    // Element is below viewport — scroll down
                    state.clampedTop = pos.y + pos.height - viewportHeight;
                }
                state.clampedTop = Math.max(0, Math.min(state.maxScroll, state.clampedTop));
                scrollRef.current = state.clampedTop;
                if (hostPropsRef.current)
                    hostPropsRef.current.scrollTop = state.clampedTop;
                // Horizontal: ensure element is in view
                const viewportWidth = hostPropsRef.current?._viewportWidth ?? 0;
                if (pos.x < state.clampedLeft) {
                    state.clampedLeft = pos.x;
                }
                else if (pos.x + pos.width > state.clampedLeft + viewportWidth) {
                    state.clampedLeft = pos.x + pos.width - viewportWidth;
                }
                state.clampedLeft = Math.max(0, Math.min(state.maxHScroll, state.clampedLeft));
                hScrollRef.current = state.clampedLeft;
                if (hostPropsRef.current)
                    hostPropsRef.current.scrollLeft = state.clampedLeft;
                requestRender();
            },
        };
    }
    // Expose scrollState to parent via ref
    if (parentScrollStateRef) {
        parentScrollStateRef.current = scrollStateRef.current;
    }
    // Imperative vertical scroll handler — called by focusManager hit-test.
    const handleScroll = useCallback((delta) => {
        const base = scrollStateRef.current.clampedTop;
        const ms = scrollStateRef.current.maxScroll;
        let next = Math.max(0, Math.min(ms, base + delta * scrollSpeed));
        if (snapToItem && itemHeight > 0) {
            next = Math.max(0, Math.min(ms, Math.round(next / itemHeight) * itemHeight));
        }
        if (next === base)
            return;
        scrollRef.current = next;
        scrollStateRef.current.clampedTop = next;
        if (hostPropsRef.current)
            hostPropsRef.current.scrollTop = next;
        onScroll?.(next);
        requestRender();
    }, [scrollSpeed, onScroll, requestRender, snapToItem, itemHeight]);
    // Imperative horizontal scroll handler
    const handleHScroll = useCallback((delta) => {
        if (!horizontalScrollRef.current)
            return;
        const base = scrollStateRef.current.clampedLeft;
        const ms = scrollStateRef.current.maxHScroll;
        const next = Math.max(0, Math.min(ms, base + delta * scrollSpeed));
        if (next === base)
            return;
        hScrollRef.current = next;
        scrollStateRef.current.clampedLeft = next;
        if (hostPropsRef.current)
            hostPropsRef.current.scrollLeft = next;
        requestRender();
    }, [scrollSpeed, requestRender]);
    const handleScrollRef = useRef(handleScroll);
    handleScrollRef.current = handleScroll;
    const handleHScrollRef = useRef(handleHScroll);
    handleHScrollRef.current = handleHScroll;
    const horizontalScrollRef = useRef(horizontalScroll);
    horizontalScrollRef.current = horizontalScroll;
    // Register with focus manager for hit-testing — eagerly, not in useEffect
    const focusRegisteredRef = useRef(false);
    if (!focusRegisteredRef.current) {
        focusRegisteredRef.current = true;
        const id = idRef.current;
        focus.register({
            id,
            type: "scroll",
            bounds: { x: 0, y: 0, width: 0, height: 0 }, // renderer updates these
            onScroll: (delta) => handleScrollRef.current(delta),
            onHScroll: (delta) => handleHScrollRef.current(delta),
            canScrollVertically: () => (scrollStateRef.current?.maxScroll ?? 0) > 0,
            canScrollHorizontally: () => horizontalScrollRef.current && (scrollStateRef.current?.maxHScroll ?? 0) > 0,
        });
    }
    // Unregister from focus manager on unmount to prevent leak
    useCleanup(() => {
        focus.unregister(idRef.current);
    });
    // Keyboard scroll — PgUp/PgDown, Shift+Up/Down, Left/Right (eagerly registered).
    // Only the ACTIVE ScrollView (last one that received mouse focus, or the sole
    // ScrollView) handles keyboard scroll. This prevents broadcasting to all mounted
    // ScrollViews simultaneously.
    const keyRegisteredRef = useRef(false);
    const keyUnsubRef = useRef(null);
    if (!keyRegisteredRef.current) {
        keyRegisteredRef.current = true;
        keyUnsubRef.current = input.onKey((event) => {
            // Only handle if this ScrollView is the active one for keyboard scroll
            const activeId = focus.activeScrollId;
            if (activeId !== null && activeId !== idRef.current)
                return;
            if (event.key === "pageup")
                handleScrollRef.current(-10);
            else if (event.key === "pagedown")
                handleScrollRef.current(10);
            else if (event.key === "up" && event.shift)
                handleScrollRef.current(-1);
            else if (event.key === "down" && event.shift)
                handleScrollRef.current(1);
            else if (event.key === "left" && horizontalScrollRef.current)
                handleHScrollRef.current(-1);
            else if (event.key === "right" && horizontalScrollRef.current)
                handleHScrollRef.current(1);
        });
    }
    // Unsubscribe key handler on unmount to prevent leak
    useCleanup(() => {
        keyUnsubRef.current?.();
    });
    // Stick-to-bottom is handled by the renderer (paintScrollView):
    // if scrollTop >= prevMaxScroll, it auto-snaps to new maxScroll.
    // No useEffect needed (React doesn't fire effects in custom reconcilers).
    // --- Automatic windowing ---
    // When the number of children exceeds maxRenderChildren, only render a
    // window of children around the current scroll position. Spacer elements
    // before and after maintain the correct total content height so the
    // scrollbar and scroll offsets remain accurate.
    const OVERSCAN = 50;
    const childArray = React.Children.toArray(children);
    const totalChildren = childArray.length;
    let renderedChildren;
    if (totalChildren > maxRenderChildren) {
        const scrollTop = scrollStateRef.current.clampedTop;
        // Estimate the first visible child index from the scroll offset.
        const estItemH = itemHeight > 0 ? itemHeight : 1;
        const startVisible = Math.floor(scrollTop / estItemH);
        // Window boundaries with overscan, clamped to valid range.
        const startIndex = Math.max(0, startVisible - OVERSCAN);
        const endIndex = Math.min(totalChildren, startVisible + maxRenderChildren + OVERSCAN);
        const topSpacerHeight = startIndex * estItemH;
        const bottomSpacerHeight = (totalChildren - endIndex) * estItemH;
        const windowedElements = [];
        // Top spacer — maintains scroll offset for items above the window.
        if (topSpacerHeight > 0) {
            windowedElements.push(React.createElement("tui-box", { key: "__sv-spacer-top", height: topSpacerHeight }));
        }
        // Visible slice of children.
        for (let i = startIndex; i < endIndex; i++) {
            windowedElements.push(childArray[i]);
        }
        // Bottom spacer — maintains scroll offset for items below the window.
        if (bottomSpacerHeight > 0) {
            windowedElements.push(React.createElement("tui-box", { key: "__sv-spacer-bottom", height: bottomSpacerHeight }));
        }
        renderedChildren = windowedElements;
    }
    else {
        renderedChildren = children;
    }
    // In dev mode, render a visible warning inside the ScrollView when height constraint is missing
    const devWarningElement = (missingHeightConstraint && process.env.NODE_ENV !== "production")
        ? React.createElement("tui-text", { color: "yellow" }, "[storm] ScrollView needs height or flex constraint")
        : null;
    return React.createElement("tui-scroll-view", {
        ...layoutProps,
        role: "region",
        scrollTop: scrollStateRef.current.clampedTop,
        ...(horizontalScroll ? { scrollLeft: scrollStateRef.current.clampedLeft } : {}),
        _scrollState: scrollStateRef.current,
        _hostPropsRef: hostPropsRef,
        _focusId: idRef.current,
        horizontalScroll,
        overflow: "scroll",
        stickToBottom,
    }, devWarningElement, renderedChildren);
});
//# sourceMappingURL=ScrollView.js.map