import React, { useRef, useCallback, createContext, useContext } from "react";
import { useInput } from "../../hooks/useInput.js";
import { useTui } from "../../context/TuiContext.js";
import { useColors } from "../../hooks/useColors.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { pickLayoutProps } from "../../styles/applyStyles.js";
import { usePersonality } from "../../core/personality.js";
import { findNextNavigable, computeScrollWindow } from "../../utils/navigation.js";
export const SelectContext = createContext(null);
export function useSelectContext() {
    const ctx = useContext(SelectContext);
    if (!ctx)
        throw new Error("Select sub-components must be used inside Select.Root");
    return ctx;
}
function SelectRoot({ value, onChange, children }) {
    const colors = useColors();
    const { requestRender } = useTui();
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const openRef = useRef(false);
    const activeIndexRef = useRef(0);
    const filterRef = useRef("");
    const ctx = {
        value,
        onChange: (val) => { onChangeRef.current?.(val); requestRender(); },
        isOpen: openRef.current,
        setOpen: (open) => { openRef.current = open; requestRender(); },
        activeIndex: activeIndexRef.current,
        setActiveIndex: (idx) => { activeIndexRef.current = idx; requestRender(); },
        filter: filterRef.current,
        setFilter: (f) => { filterRef.current = f; requestRender(); },
    };
    return React.createElement(SelectContext.Provider, { value: ctx }, children);
}
function SelectTrigger({ children, placeholder }) {
    const colors = useColors();
    const { value, isOpen, setOpen } = useSelectContext();
    const displayLabel = value ?? placeholder;
    const displayColor = value ? colors.text.primary : colors.text.dim;
    const arrow = isOpen ? " \u25B2" : " \u25BC";
    if (children) {
        return React.createElement("tui-box", { flexDirection: "row" }, children);
    }
    return React.createElement("tui-box", { flexDirection: "row" }, React.createElement("tui-text", { color: displayColor }, displayLabel), React.createElement("tui-text", { color: colors.text.dim }, arrow));
}
function SelectContent({ maxVisible, children }) {
    const colors = useColors();
    const personality = usePersonality();
    const { isOpen } = useSelectContext();
    if (!isOpen)
        return null;
    return React.createElement("tui-box", {
        flexDirection: "column",
        borderStyle: personality.borders.default,
        borderColor: colors.brand.primary,
    }, children);
}
function SelectCompoundOption({ value: optionValue, label, disabled, children }) {
    const colors = useColors();
    const { value, onChange, setOpen } = useSelectContext();
    const isSelected = optionValue === value;
    let labelColor;
    if (disabled) {
        labelColor = colors.text.disabled;
    }
    else if (isSelected) {
        labelColor = colors.brand.primary;
    }
    else {
        labelColor = colors.text.secondary;
    }
    if (children) {
        return React.createElement("tui-box", { flexDirection: "row" }, children);
    }
    const displayLabel = label ?? optionValue;
    const prefix = isSelected ? "\u25B6 " : "  ";
    return React.createElement("tui-box", { flexDirection: "row" }, React.createElement("tui-text", { color: isSelected ? colors.brand.primary : colors.text.dim }, prefix), React.createElement("tui-text", { color: labelColor, bold: isSelected && !disabled, dim: disabled }, displayLabel));
}
const SelectBase = React.memo(function Select(rawProps) {
    const colors = useColors();
    const personality = usePersonality();
    const props = usePluginProps("Select", rawProps);
    const { options, value, onChange, placeholder = "Select...", isOpen, onOpenChange, color = colors.brand.primary, isFocused = true, maxVisible, } = props;
    const { requestRender } = useTui();
    const activeIndexRef = useRef(0);
    const filterRef = useRef("");
    // Internal uncontrolled open state — used when isOpen prop is not provided
    const internalOpenRef = useRef(false);
    const isControlled = props.isOpen !== undefined;
    const effectiveIsOpen = isControlled ? isOpen : internalOpenRef.current;
    // Refs for latest prop values
    const optionsRef = useRef(options);
    optionsRef.current = options;
    const valueRef = useRef(value);
    valueRef.current = value;
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const isControlledRef = useRef(isControlled);
    isControlledRef.current = isControlled;
    const isOpenRef = useRef(effectiveIsOpen);
    isOpenRef.current = effectiveIsOpen;
    const onOpenChangeRef = useRef(onOpenChange);
    onOpenChangeRef.current = onOpenChange;
    const getFiltered = (opts, filter) => {
        if (!filter)
            return opts;
        const lower = filter.toLowerCase();
        return opts.filter((o) => o.label.toLowerCase().includes(lower));
    };
    // Sync activeIndex to current value when opening
    if (effectiveIsOpen && value !== undefined) {
        const filteredOpts = getFiltered(options, filterRef.current);
        const idx = filteredOpts.findIndex((o) => o.value === value);
        if (idx >= 0)
            activeIndexRef.current = idx;
    }
    if (!effectiveIsOpen) {
        filterRef.current = "";
    }
    const filteredOptions = getFiltered(options, effectiveIsOpen ? filterRef.current : "");
    // Clamp activeIndex
    if (activeIndexRef.current >= filteredOptions.length) {
        activeIndexRef.current = Math.max(0, filteredOptions.length - 1);
    }
    if (filteredOptions.length > 0 && filteredOptions[activeIndexRef.current]?.disabled) {
        activeIndexRef.current = findNextNavigable(filteredOptions.length, activeIndexRef.current, 1, (i) => !filteredOptions[i].disabled);
    }
    const handleInput = useCallback((event) => {
        const opts = optionsRef.current;
        if (opts.length === 0)
            return;
        if (isOpenRef.current) {
            const filtered = getFiltered(opts, filterRef.current);
            if (event.key === "up") {
                activeIndexRef.current = findNextNavigable(filtered.length, activeIndexRef.current, -1, (i) => !filtered[i].disabled);
                requestRender();
            }
            else if (event.key === "down") {
                activeIndexRef.current = findNextNavigable(filtered.length, activeIndexRef.current, 1, (i) => !filtered[i].disabled);
                requestRender();
            }
            else if (event.key === "return") {
                const selected = filtered[activeIndexRef.current];
                if (selected && !selected.disabled) {
                    onChangeRef.current?.(selected.value);
                    filterRef.current = "";
                    if (!isControlledRef.current) {
                        internalOpenRef.current = false;
                        requestRender();
                    }
                    onOpenChangeRef.current?.(false);
                }
            }
            else if (event.key === "escape") {
                filterRef.current = "";
                if (!isControlledRef.current) {
                    internalOpenRef.current = false;
                    requestRender();
                }
                onOpenChangeRef.current?.(false);
            }
            else if (event.key === "backspace") {
                if (filterRef.current.length > 0) {
                    filterRef.current = filterRef.current.slice(0, -1);
                    activeIndexRef.current = 0;
                    // Re-clamp to non-disabled
                    const newFiltered = getFiltered(opts, filterRef.current);
                    if (newFiltered.length > 0 && newFiltered[0]?.disabled) {
                        activeIndexRef.current = findNextNavigable(newFiltered.length, 0, 1, (i) => !newFiltered[i].disabled);
                    }
                    requestRender();
                }
            }
            else if (event.char && event.char.length === 1 && !event.ctrl && !event.meta) {
                filterRef.current += event.char;
                activeIndexRef.current = 0;
                const newFiltered = getFiltered(opts, filterRef.current);
                if (newFiltered.length > 0 && newFiltered[0]?.disabled) {
                    activeIndexRef.current = findNextNavigable(newFiltered.length, 0, 1, (i) => !newFiltered[i].disabled);
                }
                requestRender();
            }
        }
        else {
            if (event.key === "return") {
                if (!isControlledRef.current) {
                    internalOpenRef.current = true;
                    requestRender();
                }
                onOpenChangeRef.current?.(true);
            }
        }
    }, [requestRender]);
    useInput(handleInput, { isActive: isFocused });
    const selectedOption = options.find((o) => o.value === value);
    const displayLabel = selectedOption ? selectedOption.label : placeholder;
    const displayColor = selectedOption ? colors.text.primary : colors.text.dim;
    const boxProps = { role: "listbox", flexDirection: "column", "aria-label": props["aria-label"], ...pickLayoutProps(props) };
    // Empty options — render placeholder instead of dropdown
    if (options.length === 0) {
        return React.createElement("tui-text", { color: colors.text.dim, dim: true }, "No options");
    }
    if (!effectiveIsOpen) {
        // Closed state: show selected value with dropdown arrow
        return React.createElement("tui-box", { ...boxProps, flexDirection: "row" }, React.createElement("tui-text", { color: displayColor }, displayLabel), React.createElement("tui-text", { color: colors.text.dim }, " \u25BC"));
    }
    // Open state: show trigger + dropdown list
    const children = [];
    children.push(React.createElement("tui-box", { key: "trigger", flexDirection: "row" }, React.createElement("tui-text", { color: displayColor }, displayLabel), React.createElement("tui-text", { color: colors.text.dim }, " \u25B2")));
    if (filterRef.current) {
        children.push(React.createElement("tui-box", { key: "filter", flexDirection: "row" }, React.createElement("tui-text", { color: colors.text.dim }, "Filter: "), React.createElement("tui-text", { color: colors.text.primary }, filterRef.current)));
    }
    // Dropdown list with border — apply maxVisible scroll window
    const { start: scrollStart, end: scrollEnd } = maxVisible !== undefined
        ? computeScrollWindow(filteredOptions.length, activeIndexRef.current, maxVisible)
        : { start: 0, end: filteredOptions.length };
    const visibleOptions = { items: filteredOptions.slice(scrollStart, scrollEnd), offset: scrollStart };
    const renderedGroups = new Set();
    const optionElements = [];
    for (let i = 0; i < visibleOptions.items.length; i++) {
        const option = visibleOptions.items[i];
        const index = i + visibleOptions.offset;
        const isActive = index === activeIndexRef.current;
        const isSelected = option.value === value;
        const isDisabled = !!option.disabled;
        // Group header — render before first item of each group
        if (option.group && !renderedGroups.has(option.group)) {
            renderedGroups.add(option.group);
            // Group header: bold label + dim separator
            optionElements.push(React.createElement("tui-box", { key: `group-${option.group}`, flexDirection: "column" }, React.createElement("tui-text", { bold: true, color: colors.text.primary }, `  ${option.group}`), React.createElement("tui-text", { color: colors.text.dim, dim: true }, "  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500")));
        }
        let labelColor;
        if (isDisabled) {
            labelColor = colors.text.disabled;
        }
        else if (isActive) {
            labelColor = color;
        }
        else if (isSelected) {
            labelColor = colors.text.primary;
        }
        else {
            labelColor = colors.text.secondary;
        }
        const prefix = isActive ? "\u25B6 " : "  ";
        const itemChildren = [
            React.createElement("tui-text", { key: "prefix", color: isActive ? color : colors.text.dim }, prefix),
            React.createElement("tui-text", { key: "label", color: labelColor, bold: isActive && !isDisabled, dim: isDisabled }, option.label),
        ];
        // Description (dim text after label)
        if (option.description) {
            itemChildren.push(React.createElement("tui-text", { key: "desc", color: colors.text.dim, dim: true }, ` - ${option.description}`));
        }
        if (props.renderOption) {
            optionElements.push(React.createElement("tui-box", { key: option.value, flexDirection: "row" }, props.renderOption(option, { isActive, isSelected, isDisabled })));
        }
        else {
            optionElements.push(React.createElement("tui-box", { key: option.value, flexDirection: "row" }, ...itemChildren));
        }
    }
    children.push(React.createElement("tui-box", {
        key: "dropdown",
        flexDirection: "column",
        borderStyle: personality.borders.default,
        borderColor: color,
    }, ...optionElements));
    return React.createElement("tui-box", boxProps, ...children);
});
export const Select = Object.assign(SelectBase, {
    Root: SelectRoot,
    Trigger: SelectTrigger,
    Content: SelectContent,
    Option: SelectCompoundOption,
});
//# sourceMappingURL=Select.js.map