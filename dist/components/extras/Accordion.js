import React, { useRef, useCallback, createContext, useContext } from "react";
import { useInput } from "../../hooks/useInput.js";
import { useTui } from "../../context/TuiContext.js";
import { useCleanup } from "../../hooks/useCleanup.js";
import { useColors } from "../../hooks/useColors.js";
import { mergeBoxStyles, pickStyleProps } from "../../styles/applyStyles.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { usePersonality } from "../../core/personality.js";
export const AccordionContext = createContext(null);
export function useAccordionContext() {
    const ctx = useContext(AccordionContext);
    if (!ctx)
        throw new Error("Accordion sub-components must be used inside Accordion.Root");
    return ctx;
}
export const AccordionSectionContext = createContext(null);
export function useAccordionSectionContext() {
    const ctx = useContext(AccordionSectionContext);
    if (!ctx)
        throw new Error("Accordion.Header/Content must be used inside Accordion.Section");
    return ctx;
}
function AccordionRoot({ activeKeys = [], onToggle, exclusive = false, children }) {
    const colors = useColors();
    const { requestRender } = useTui();
    const onToggleRef = useRef(onToggle);
    onToggleRef.current = onToggle;
    const ctx = {
        activeKeys,
        toggle: (key) => { onToggleRef.current?.(key); requestRender(); },
        exclusive,
    };
    return React.createElement(AccordionContext.Provider, { value: ctx }, React.createElement("tui-box", { flexDirection: "column" }, children));
}
function AccordionCompoundSection({ sectionKey, children }) {
    const { activeKeys } = useAccordionContext();
    const isExpanded = activeKeys.includes(sectionKey);
    const sectionCtx = { sectionKey, isExpanded };
    return React.createElement(AccordionSectionContext.Provider, { value: sectionCtx }, React.createElement("tui-box", { flexDirection: "column" }, children));
}
function AccordionCompoundHeader({ children }) {
    const colors = useColors();
    const { toggle } = useAccordionContext();
    const { sectionKey, isExpanded } = useAccordionSectionContext();
    const marker = isExpanded ? "\u25BC" : "\u25B6";
    if (children) {
        return React.createElement("tui-box", { flexDirection: "row" }, children);
    }
    return React.createElement("tui-box", { flexDirection: "row" }, React.createElement("tui-text", { color: colors.brand.primary }, `${marker} `), React.createElement("tui-text", { bold: true, color: colors.text.primary }, sectionKey));
}
function AccordionCompoundContent({ children }) {
    const { isExpanded } = useAccordionSectionContext();
    if (!isExpanded)
        return null;
    return React.createElement("tui-box", { paddingLeft: 2 }, children);
}
const COLLAPSED = "\u25B6"; // ▶
const EXPANDED = "\u25BC"; // ▼
const AccordionBase = React.memo(function Accordion(rawProps) {
    const colors = useColors();
    const personality = usePersonality();
    const props = usePluginProps("Accordion", rawProps);
    const { sections, activeKeys = [], onToggle, exclusive = false, color = colors.brand.primary, animated = false, isFocused = true, } = props;
    const userStyles = pickStyleProps(props);
    const focusedRef = useRef(0);
    const sectionsRef = useRef(sections);
    sectionsRef.current = sections;
    const onToggleRef = useRef(onToggle);
    onToggleRef.current = onToggle;
    const exclusiveRef = useRef(exclusive);
    exclusiveRef.current = exclusive;
    // Internal open sections for exclusive mode management
    const internalOpenRef = useRef(new Set(activeKeys));
    internalOpenRef.current = new Set(activeKeys);
    const { requestRender, renderContext } = useTui();
    const requestRenderRef = useRef(requestRender);
    requestRenderRef.current = requestRender;
    // Animation state: track sections that are transitioning
    const prevActiveRef = useRef(new Set(activeKeys));
    // Map of section key -> { expanding: boolean, progress: 0-1, timer }
    const transitionsRef = useRef(new Map());
    const unsubRef = useRef(null);
    const transitionStartRef = useRef(new Map());
    const TRANSITION_MS = personality.animation.durationNormal;
    if (animated) {
        const prevActive = prevActiveRef.current;
        const currentActive = new Set(activeKeys);
        // Detect newly expanded sections
        for (const key of currentActive) {
            if (!prevActive.has(key)) {
                transitionsRef.current.set(key, { expanding: true, progress: 0 });
                transitionStartRef.current.set(key, Date.now());
            }
        }
        // Detect newly collapsed sections
        for (const key of prevActive) {
            if (!currentActive.has(key)) {
                transitionsRef.current.set(key, { expanding: false, progress: 1 });
                transitionStartRef.current.set(key, Date.now());
            }
        }
        prevActiveRef.current = currentActive;
        // Run animation tick via scheduler if there are active transitions
        if (transitionsRef.current.size > 0 && !unsubRef.current) {
            unsubRef.current = renderContext.animationScheduler.add((_frameTime) => {
                const now = Date.now();
                let anyActive = false;
                for (const [key, tr] of transitionsRef.current) {
                    const startTime = transitionStartRef.current.get(key) ?? now;
                    const elapsed = now - startTime;
                    const t = Math.min(1, elapsed / TRANSITION_MS);
                    // easeOut: t * (2 - t)
                    const eased = t * (2 - t);
                    if (tr.expanding) {
                        tr.progress = eased;
                    }
                    else {
                        tr.progress = 1 - eased;
                    }
                    if (t < 1) {
                        anyActive = true;
                    }
                    else {
                        transitionsRef.current.delete(key);
                        transitionStartRef.current.delete(key);
                    }
                }
                if (!anyActive && unsubRef.current) {
                    unsubRef.current();
                    unsubRef.current = null;
                }
            });
        }
    }
    useCleanup(() => {
        if (unsubRef.current) {
            unsubRef.current();
            unsubRef.current = null;
        }
    });
    const handleToggle = useCallback((sectionKey) => {
        const cb = onToggleRef.current;
        if (!cb)
            return;
        // In both exclusive and non-exclusive mode, just call onToggle once
        // with the target key. The parent is responsible for managing activeKeys
        // (e.g. setting activeKeys to just [newKey] in exclusive mode).
        cb(sectionKey);
    }, []);
    const handleInput = useCallback((event) => {
        const currentSections = sectionsRef.current;
        if (currentSections.length === 0)
            return;
        if (event.key === "up") {
            focusedRef.current =
                focusedRef.current > 0
                    ? focusedRef.current - 1
                    : currentSections.length - 1;
            requestRenderRef.current();
        }
        else if (event.key === "down") {
            focusedRef.current =
                focusedRef.current < currentSections.length - 1
                    ? focusedRef.current + 1
                    : 0;
            requestRenderRef.current();
        }
        else if (event.key === "return" || event.key === "space") {
            const section = currentSections[focusedRef.current];
            if (section) {
                handleToggle(section.key);
            }
        }
    }, [handleToggle]);
    useInput(handleInput, { isActive: isFocused && onToggle !== undefined });
    // Clamp focused index when sections shrink
    focusedRef.current = Math.min(focusedRef.current, sections.length - 1);
    const elements = [];
    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const isExpanded = activeKeys.includes(section.key);
        const transition = transitionsRef.current.get(section.key);
        const isFocused = i === focusedRef.current;
        const marker = isExpanded || (transition && transition.expanding) ? EXPANDED : COLLAPSED;
        // Section header
        if (props.renderSectionHeader) {
            elements.push(React.createElement("tui-box", { key: `header-${section.key}`, flexDirection: "row" }, props.renderSectionHeader({ key: section.key, title: section.title, expanded: isExpanded, focused: isFocused })));
        }
        else {
            elements.push(React.createElement("tui-box", { key: `header-${section.key}`, flexDirection: "row" }, React.createElement("tui-text", { color }, `${marker} `), React.createElement("tui-text", {
                bold: isFocused,
                color: isFocused ? colors.text.primary : colors.text.secondary,
            }, section.title)));
        }
        // Section content: show when expanded or during animated transition
        const showContent = isExpanded || (animated && transition !== undefined);
        if (showContent) {
            const contentProps = {
                key: `content-${section.key}`,
                paddingLeft: 2,
            };
            // During animation, limit visible height via maxHeight
            if (animated && transition) {
                // Use dim to visually indicate transition progress
                const dimming = transition.progress < 0.5;
                elements.push(React.createElement("tui-box", contentProps, dimming
                    ? React.createElement("tui-box", { dim: true }, section.content)
                    : section.content));
            }
            else {
                elements.push(React.createElement("tui-box", contentProps, section.content));
            }
        }
    }
    const boxProps = mergeBoxStyles({ flexDirection: "column", role: "region" }, userStyles);
    return React.createElement("tui-box", boxProps, ...elements);
});
export const Accordion = Object.assign(AccordionBase, {
    Root: AccordionRoot,
    Section: AccordionCompoundSection,
    Header: AccordionCompoundHeader,
    Content: AccordionCompoundContent,
});
//# sourceMappingURL=Accordion.js.map