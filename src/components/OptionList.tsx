/**
 * OptionList — scrollable vertical list of selectable options.
 *
 * A simpler alternative to Select: no dropdown, just a visible list
 * with keyboard navigation (Up/Down/Enter). Supports disabled items,
 * separator dividers, styled labels, configurable selection indicator,
 * optional index display, and scroll windowing via maxVisible.
 *
 * Features:
 * - Up/Down arrows navigate (skipping separators and disabled items)
 * - Enter selects the active option
 * - Optional onChange callback when highlighted item changes
 * - Rich content support via renderItem
 * - Configurable selection indicator character
 * - Optional line numbers / index display
 * - Compound component API (OptionList.Root / .Item / .Separator)
 */

import React, { useRef, useCallback, createContext, useContext } from "react";
import { useInput } from "../hooks/useInput.js";
import { useTui } from "../context/TuiContext.js";
import type { KeyEvent } from "../input/types.js";
import { useColors } from "../hooks/useColors.js";
import type { StormLayoutStyleProps } from "../styles/styleProps.js";
import { usePluginProps } from "../hooks/usePluginProps.js";
import { usePersonality } from "../core/personality.js";

export interface OptionListItem {
  /** Display text for the option. */
  label: string;
  /** Value passed to onSelect when chosen. */
  value: string;
  /** If true, the item cannot be selected or navigated to. */
  disabled?: boolean;
  /** If true, renders a divider line instead of a selectable option. */
  separator?: boolean;
  /** Rich content: React node rendered in place of the plain label. */
  richLabel?: React.ReactNode;
}

export interface OptionListProps extends StormLayoutStyleProps {
  items: OptionListItem[];
  /** Fired when the user presses Enter on an active option. */
  onSelect?: (value: string) => void;
  /** Fired when the highlighted/active item changes. */
  onChange?: (value: string) => void;
  /** Whether this component receives keyboard input. */
  isFocused?: boolean;
  /** Color for the active/highlighted item. */
  activeColor?: string | number;
  /** Maximum visible items before scrolling kicks in. */
  maxVisible?: number;
  /** Override the selection indicator character. */
  indicator?: string;
  /** Show line numbers / index for each option. */
  showIndex?: boolean;
  "aria-label"?: string;
  /** Custom renderer for each option item. */
  renderItem?: (
    item: OptionListItem,
    state: { isActive: boolean; isDisabled: boolean; index: number },
  ) => React.ReactNode;
}

// ── Compound Component API ──────────────────────────────────────

export interface OptionListContextValue {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  onSelect: ((value: string) => void) | undefined;
}

export const OptionListContext = createContext<OptionListContextValue | null>(null);

export function useOptionListContext(): OptionListContextValue {
  const ctx = useContext(OptionListContext);
  if (!ctx) throw new Error("OptionList sub-components must be used inside OptionList.Root");
  return ctx;
}

export interface OptionListRootProps {
  onSelect?: (value: string) => void;
  children: React.ReactNode;
}

function OptionListRoot({ onSelect, children }: OptionListRootProps): React.ReactElement {
  const { requestRender } = useTui();
  const activeIndexRef = useRef(0);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const ctx: OptionListContextValue = {
    activeIndex: activeIndexRef.current,
    setActiveIndex: (idx: number) => {
      activeIndexRef.current = idx;
      requestRender();
    },
    onSelect,
  };

  return React.createElement(
    OptionListContext.Provider,
    { value: ctx },
    React.createElement("tui-box", { flexDirection: "column" }, children),
  );
}

export interface OptionListCompoundItemProps {
  value: string;
  label?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

function OptionListCompoundItem({
  value,
  label,
  disabled = false,
  children,
}: OptionListCompoundItemProps): React.ReactElement {
  const colors = useColors();
  const personality = usePersonality();
  const { activeIndex } = useOptionListContext();
  const displayLabel = label ?? value;

  if (children) {
    return React.createElement("tui-box", { flexDirection: "row" }, children);
  }

  return React.createElement(
    "tui-text",
    {
      color: disabled ? colors.text.disabled : colors.text.primary,
      dim: disabled,
      strikethrough: disabled,
    },
    `  ${displayLabel}`,
  );
}

export interface OptionListSeparatorProps {
  children?: React.ReactNode;
}

function OptionListSeparator({ children }: OptionListSeparatorProps): React.ReactElement {
  const colors = useColors();
  if (children) {
    return React.createElement("tui-box", {}, children);
  }

  return React.createElement(
    "tui-text",
    { color: colors.divider, dim: true },
    `  \u2500\u2500\u2500`,
  );
}

// ── Recipe API helpers ────────────────────────────────────────

const SEPARATOR_LINE = "\u2500\u2500\u2500";

function isNavigable(item: OptionListItem): boolean {
  return !item.separator && !item.disabled;
}

function findNextNavigable(items: OptionListItem[], from: number, direction: 1 | -1): number {
  const len = items.length;
  let idx = from;
  for (let i = 0; i < len; i++) {
    idx = (idx + direction + len) % len;
    if (isNavigable(items[idx]!)) return idx;
  }
  return from;
}

function findFirstNavigable(items: OptionListItem[]): number {
  for (let i = 0; i < items.length; i++) {
    if (isNavigable(items[i]!)) return i;
  }
  return 0;
}

const OptionListBase = React.memo(function OptionList(rawProps: OptionListProps): React.ReactElement {
  const colors = useColors();
  const personality = usePersonality();
  const props = usePluginProps("OptionList", rawProps as unknown as Record<string, unknown>) as unknown as OptionListProps;
  const {
    items,
    onSelect,
    onChange,
    isFocused = true,
    color = colors.text.primary,
    activeColor = colors.brand.primary,
    width,
    height,
    margin,
    marginX,
    marginY,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    minWidth,
    maxWidth,
    maxVisible,
    indicator,
    showIndex = false,
    renderItem,
  } = props;

  const { requestRender } = useTui();
  const activeIndexRef = useRef(findFirstNavigable(items));

  // Refs for latest prop values
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Clamp active index if items changed
  if (activeIndexRef.current >= items.length) {
    activeIndexRef.current = findFirstNavigable(items);
  }
  if (items[activeIndexRef.current] && !isNavigable(items[activeIndexRef.current]!)) {
    activeIndexRef.current = findNextNavigable(items, activeIndexRef.current, 1);
  }

  const handleInput = useCallback(
    (event: KeyEvent) => {
      const itms = itemsRef.current;
      const cb = onSelectRef.current;
      const changeCb = onChangeRef.current;

      if (event.key === "up") {
        const next = findNextNavigable(itms, activeIndexRef.current, -1);
        if (next !== activeIndexRef.current) {
          activeIndexRef.current = next;
          const item = itms[next];
          if (item && changeCb) changeCb(item.value);
          requestRender();
        }
      } else if (event.key === "down") {
        const next = findNextNavigable(itms, activeIndexRef.current, 1);
        if (next !== activeIndexRef.current) {
          activeIndexRef.current = next;
          const item = itms[next];
          if (item && changeCb) changeCb(item.value);
          requestRender();
        }
      } else if (event.key === "return") {
        const item = itms[activeIndexRef.current];
        if (item && isNavigable(item) && cb) {
          cb(item.value);
        }
      }
    },
    [],
  );

  useInput(handleInput, { isActive: isFocused });

  // Empty items — render placeholder after all hooks
  if (items.length === 0) {
    return React.createElement(
      "tui-text",
      { color: colors.text.dim, dim: true },
      "No options",
    );
  }

  const outerBoxProps: Record<string, unknown> = {
    role: "listbox",
    flexDirection: "column",
    "aria-label": props["aria-label"],
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
    ...(margin !== undefined ? { margin } : {}),
    ...(marginX !== undefined ? { marginX } : {}),
    ...(marginY !== undefined ? { marginY } : {}),
    ...(marginTop !== undefined ? { marginTop } : {}),
    ...(marginBottom !== undefined ? { marginBottom } : {}),
    ...(marginLeft !== undefined ? { marginLeft } : {}),
    ...(marginRight !== undefined ? { marginRight } : {}),
    ...(minWidth !== undefined ? { minWidth } : {}),
    ...(maxWidth !== undefined ? { maxWidth } : {}),
  };

  const currentActiveIdx = activeIndexRef.current;
  const selectionChar = indicator ?? personality.interaction.selectionChar;

  // Apply maxVisible scroll window
  let visibleStart = 0;
  let visibleItems = items;
  if (maxVisible !== undefined && items.length > maxVisible) {
    const halfPage = Math.floor(maxVisible / 2);
    visibleStart = Math.max(0, currentActiveIdx - halfPage);
    visibleStart = Math.min(visibleStart, items.length - maxVisible);
    visibleItems = items.slice(visibleStart, visibleStart + maxVisible);
  }

  const hasOverflowTop = visibleStart > 0;
  const hasOverflowBottom = maxVisible !== undefined && visibleStart + maxVisible < items.length;

  const elements: React.ReactElement[] = [];

  if (hasOverflowTop) {
    elements.push(
      React.createElement(
        "tui-text",
        { key: "__overflow-top", color: colors.text.dim },
        "  \u00B7\u00B7\u00B7",
      ),
    );
  }

  for (let i = 0; i < visibleItems.length; i++) {
    const item = visibleItems[i]!;
    const index = visibleStart + i;

    // Separator line
    if (item.separator) {
      elements.push(
        React.createElement(
          "tui-text",
          { key: `sep-${index}`, color: colors.divider, dim: true },
          `  ${SEPARATOR_LINE}`,
        ),
      );
      continue;
    }

    const isActive = index === currentActiveIdx;
    const isDisabled = !!item.disabled;

    // Custom renderer
    if (renderItem) {
      elements.push(
        React.createElement(
          "tui-box",
          { key: item.value, flexDirection: "row" },
          renderItem(item, { isActive, isDisabled, index }),
        ),
      );
      continue;
    }

    let textColor: string | number;
    if (isDisabled) {
      textColor = colors.text.disabled;
    } else if (isActive) {
      textColor = activeColor;
    } else {
      textColor = color;
    }

    const indicatorStr = isActive ? `${selectionChar} ` : "  ";
    const indexPrefix = showIndex ? `${String(index + 1).padStart(2, " ")}. ` : "";

    const children: React.ReactElement[] = [];

    // Rich label or plain label
    if (item.richLabel && !isDisabled) {
      children.push(
        React.createElement(
          "tui-text",
          { key: "ind", color: isActive ? activeColor : color, bold: isActive },
          `${indicatorStr}${indexPrefix}`,
        ),
      );
      children.push(
        React.createElement(
          React.Fragment,
          { key: "rich" },
          item.richLabel,
        ),
      );
    } else {
      children.push(
        React.createElement(
          "tui-text",
          {
            key: "label",
            color: textColor,
            bold: isActive,
            dim: isDisabled,
            strikethrough: isDisabled,
          },
          `${indicatorStr}${indexPrefix}${item.label}`,
        ),
      );
    }

    elements.push(
      React.createElement(
        "tui-box",
        { key: item.value, flexDirection: "row" },
        ...children,
      ),
    );
  }

  if (hasOverflowBottom) {
    elements.push(
      React.createElement(
        "tui-text",
        { key: "__overflow-bottom", color: colors.text.dim },
        "  \u00B7\u00B7\u00B7",
      ),
    );
  }

  return React.createElement(
    "tui-box",
    outerBoxProps,
    ...elements,
  );
});

// ── Static compound assignments ─────────────────────────────────
export const OptionList = Object.assign(OptionListBase, {
  Root: OptionListRoot,
  Item: OptionListCompoundItem,
  Separator: OptionListSeparator,
});
