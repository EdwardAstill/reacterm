import React, { useRef, useCallback, createContext, useContext } from "react";
import { useInput } from "../../hooks/useInput.js";
import { useTui } from "../../context/TuiContext.js";
import { useColors } from "../../hooks/useColors.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { usePersonality } from "../../core/personality.js";
import { pickLayoutProps } from "../../styles/applyStyles.js";
import { findNextNavigable as findNextNav, findFirstNavigable as findFirstNav, computeScrollWindow } from "../../utils/navigation.js";
export const OptionListContext = createContext(null);
export function useOptionListContext() {
    const ctx = useContext(OptionListContext);
    if (!ctx)
        throw new Error("OptionList sub-components must be used inside OptionList.Root");
    return ctx;
}
function OptionListRoot({ onSelect, children }) {
    const { requestRender } = useTui();
    const activeIndexRef = useRef(0);
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;
    const ctx = {
        activeIndex: activeIndexRef.current,
        setActiveIndex: (idx) => {
            activeIndexRef.current = idx;
            requestRender();
        },
        onSelect,
    };
    return React.createElement(OptionListContext.Provider, { value: ctx }, React.createElement("tui-box", { flexDirection: "column" }, children));
}
function OptionListCompoundItem({ value, label, disabled = false, children, }) {
    const colors = useColors();
    const { activeIndex } = useOptionListContext();
    const displayLabel = label ?? value;
    if (children) {
        return React.createElement("tui-box", { flexDirection: "row" }, children);
    }
    return React.createElement("tui-text", {
        color: disabled ? colors.text.disabled : colors.text.primary,
        dim: disabled,
        strikethrough: disabled,
    }, `  ${displayLabel}`);
}
function OptionListSeparator({ children }) {
    const colors = useColors();
    if (children) {
        return React.createElement("tui-box", {}, children);
    }
    return React.createElement("tui-text", { color: colors.divider, dim: true }, `  \u2500\u2500\u2500`);
}
const SEPARATOR_LINE = "\u2500\u2500\u2500";
function isNavigable(item) {
    return !item.separator && !item.disabled;
}
function findNextItem(items, from, direction) {
    return findNextNav(items.length, from, direction, (i) => isNavigable(items[i]));
}
function findFirstItem(items) {
    return findFirstNav(items.length, (i) => isNavigable(items[i]));
}
const OptionListBase = React.memo(function OptionList(rawProps) {
    const colors = useColors();
    const personality = usePersonality();
    const props = usePluginProps("OptionList", rawProps);
    const { items, onSelect, onChange, isFocused = true, color = colors.text.primary, activeColor = colors.brand.primary, maxVisible, indicator, showIndex = false, renderItem, } = props;
    const { requestRender } = useTui();
    const activeIndexRef = useRef(findFirstItem(items));
    // Refs for latest prop values
    const itemsRef = useRef(items);
    itemsRef.current = items;
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    // Clamp active index if items changed
    if (activeIndexRef.current >= items.length) {
        activeIndexRef.current = findFirstItem(items);
    }
    if (items[activeIndexRef.current] && !isNavigable(items[activeIndexRef.current])) {
        activeIndexRef.current = findNextItem(items, activeIndexRef.current, 1);
    }
    const handleInput = useCallback((event) => {
        const itms = itemsRef.current;
        const cb = onSelectRef.current;
        const changeCb = onChangeRef.current;
        if (event.key === "up") {
            const next = findNextItem(itms, activeIndexRef.current, -1);
            if (next !== activeIndexRef.current) {
                activeIndexRef.current = next;
                const item = itms[next];
                if (item && changeCb)
                    changeCb(item.value);
                requestRender();
            }
        }
        else if (event.key === "down") {
            const next = findNextItem(itms, activeIndexRef.current, 1);
            if (next !== activeIndexRef.current) {
                activeIndexRef.current = next;
                const item = itms[next];
                if (item && changeCb)
                    changeCb(item.value);
                requestRender();
            }
        }
        else if (event.key === "return") {
            const item = itms[activeIndexRef.current];
            if (item && isNavigable(item) && cb) {
                cb(item.value);
            }
        }
    }, []);
    useInput(handleInput, { isActive: isFocused });
    // Empty items — render placeholder after all hooks
    if (items.length === 0) {
        return React.createElement("tui-text", { color: colors.text.dim, dim: true }, "No options");
    }
    const outerBoxProps = {
        role: "listbox",
        flexDirection: "column",
        "aria-label": props["aria-label"],
        ...pickLayoutProps(props),
    };
    const currentActiveIdx = activeIndexRef.current;
    const selectionChar = indicator ?? personality.interaction.selectionChar;
    const { start: visibleStart, end: visibleEnd } = maxVisible !== undefined
        ? computeScrollWindow(items.length, currentActiveIdx, maxVisible)
        : { start: 0, end: items.length };
    const visibleItems = items.slice(visibleStart, visibleEnd);
    const hasOverflowTop = visibleStart > 0;
    const hasOverflowBottom = visibleEnd < items.length;
    const elements = [];
    if (hasOverflowTop) {
        elements.push(React.createElement("tui-text", { key: "__overflow-top", color: colors.text.dim }, "  \u00B7\u00B7\u00B7"));
    }
    for (let i = 0; i < visibleItems.length; i++) {
        const item = visibleItems[i];
        const index = visibleStart + i;
        // Separator line
        if (item.separator) {
            elements.push(React.createElement("tui-text", { key: `sep-${index}`, color: colors.divider, dim: true }, `  ${SEPARATOR_LINE}`));
            continue;
        }
        const isActive = index === currentActiveIdx;
        const isDisabled = !!item.disabled;
        // Custom renderer
        if (renderItem) {
            elements.push(React.createElement("tui-box", { key: item.value, flexDirection: "row" }, renderItem(item, { isActive, isDisabled, index })));
            continue;
        }
        let textColor;
        if (isDisabled) {
            textColor = colors.text.disabled;
        }
        else if (isActive) {
            textColor = activeColor;
        }
        else {
            textColor = color;
        }
        const indicatorStr = isActive ? `${selectionChar} ` : "  ";
        const indexPrefix = showIndex ? `${String(index + 1).padStart(2, " ")}. ` : "";
        const children = [];
        // Rich label or plain label
        if (item.richLabel && !isDisabled) {
            children.push(React.createElement("tui-text", { key: "ind", color: isActive ? activeColor : color, bold: isActive }, `${indicatorStr}${indexPrefix}`));
            children.push(React.createElement(React.Fragment, { key: "rich" }, item.richLabel));
        }
        else {
            children.push(React.createElement("tui-text", {
                key: "label",
                color: textColor,
                bold: isActive,
                dim: isDisabled,
                strikethrough: isDisabled,
            }, `${indicatorStr}${indexPrefix}${item.label}`));
        }
        elements.push(React.createElement("tui-box", { key: item.value, flexDirection: "row" }, ...children));
    }
    if (hasOverflowBottom) {
        elements.push(React.createElement("tui-text", { key: "__overflow-bottom", color: colors.text.dim }, "  \u00B7\u00B7\u00B7"));
    }
    return React.createElement("tui-box", outerBoxProps, ...elements);
});
export const OptionList = Object.assign(OptionListBase, {
    Root: OptionListRoot,
    Item: OptionListCompoundItem,
    Separator: OptionListSeparator,
});
//# sourceMappingURL=OptionList.js.map