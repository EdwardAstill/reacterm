import React, { useRef, useCallback, createContext, useContext } from "react";
import { useInput } from "../../hooks/useInput.js";
import { useTui } from "../../context/TuiContext.js";
import { useColors } from "../../hooks/useColors.js";
import type { KeyEvent } from "../../input/types.js";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
import { pickStyleProps } from "../../styles/applyStyles.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { findNextNavigable as findNextNav } from "../../utils/navigation.js";
import { useMouseTarget } from "../../hooks/useMouseTarget.js";

export interface Tab {
  key: string;
  label: string;
  /** When true, show "x" after label. Delete/Backspace on active tab calls onClose. */
  closable?: boolean;
  /** When true, tab renders dimmed and is skipped by keyboard navigation. */
  disabled?: boolean;
}

export type TabsVariant = "bracket" | "plain" | "pill";

export interface TabsProps extends StormLayoutStyleProps {
  tabs: Tab[];
  activeKey: string;
  onChange?: (key: string) => void;
  /** Called when a closable tab is closed (via Delete/Backspace). */
  onClose?: (key: string) => void;
  isFocused?: boolean;
  "aria-label"?: string;
  /** Layout orientation: "horizontal" (default) or "vertical". */
  orientation?: "horizontal" | "vertical";
  /** Visual style for the tab labels. */
  variant?: TabsVariant;
  /** Color used for inactive, non-disabled tabs. */
  inactiveColor?: string | number;
  /** Background color applied to active tabs. */
  activeBackgroundColor?: string | number;
  /** Background color applied to inactive tabs. */
  inactiveBackgroundColor?: string | number;
  /** Enable Left/Right or Up/Down navigation. Default: true. */
  enableArrows?: boolean;
  /** Enable number-key selection (1-9). Default: true. */
  enableNumbers?: boolean;
  /** Enable Delete/Backspace closable-tab handling. Default: true. */
  enableCloseKeys?: boolean;
  /** Custom renderer for each tab. */
  renderTab?: (tab: Tab, state: { isActive: boolean; isDisabled: boolean }) => React.ReactNode;
}

function findNextTab(tabs: Tab[], fromIndex: number, direction: 1 | -1): number {
  return findNextNav(tabs.length, fromIndex, direction, (i) => !tabs[i]!.disabled, -1);
}

export interface TabsContextValue {
  activeKey: string;
  setActiveKey: (key: string) => void;
  orientation: "horizontal" | "vertical";
}

export const TabsContext = createContext<TabsContextValue | null>(null);

export function useTabsContext(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs sub-components must be used inside Tabs.Root");
  return ctx;
}

export interface TabsRootProps {
  activeKey: string;
  onActiveKeyChange?: (key: string) => void;
  orientation?: "horizontal" | "vertical";
  children: React.ReactNode;
}

function TabsRoot({ activeKey, onActiveKeyChange, orientation = "horizontal", children }: TabsRootProps): React.ReactElement {
  const colors = useColors();
  const { requestRender } = useTui();
  const onChangeRef = useRef(onActiveKeyChange);
  onChangeRef.current = onActiveKeyChange;

  const ctx: TabsContextValue = {
    activeKey,
    setActiveKey: (key: string) => { onChangeRef.current?.(key); requestRender(); },
    orientation,
  };

  return React.createElement(TabsContext.Provider, { value: ctx }, children);
}

export interface TabsTriggerProps {
  tabKey: string;
  disabled?: boolean;
  closable?: boolean;
  children?: React.ReactNode;
  color?: string | number;
}

function TabsTrigger({ tabKey, disabled = false, closable = false, children, color: triggerColor }: TabsTriggerProps): React.ReactElement {
  const colors = useColors();
  const { activeKey } = useTabsContext();
  const isActive = activeKey === tabKey;
  const effectiveColor = triggerColor ?? colors.brand.primary;

  if (children) {
    return React.createElement("tui-box", { flexDirection: "row" }, children);
  }

  const textProps: Record<string, unknown> = {};
  if (disabled) {
    textProps["dim"] = true;
    textProps["color"] = colors.text.disabled;
  } else if (isActive) {
    textProps["bold"] = true;
    textProps["color"] = effectiveColor;
  } else {
    textProps["dim"] = true;
  }

  const labelText = closable ? `[ ${tabKey} \u00D7 ]` : `[ ${tabKey} ]`;

  return React.createElement("tui-text", textProps, labelText);
}

export interface TabsPanelProps {
  tabKey: string;
  children: React.ReactNode;
}

function TabsPanel({ tabKey, children }: TabsPanelProps): React.ReactElement | null {
  const { activeKey } = useTabsContext();
  if (activeKey !== tabKey) return null;
  return React.createElement("tui-box", { flexDirection: "column" }, children);
}

function getTabLabelText(tab: Tab, variant: TabsVariant): string {
  const closableSuffix = tab.closable ? " \u00D7" : "";
  switch (variant) {
    case "plain":
      return `${tab.label}${closableSuffix}`;
    case "pill":
      return ` ${tab.label}${closableSuffix} `;
    case "bracket":
    default:
      return tab.closable ? `[ ${tab.label} \u00D7 ]` : `[ ${tab.label} ]`;
  }
}

interface TabsItemProps {
  tab: Tab;
  isActive: boolean;
  isDisabled: boolean;
  onSelect: () => void;
  color: string | number;
  inactiveColor: string | number;
  activeBackgroundColor: string | number | undefined;
  inactiveBackgroundColor: string | number | undefined;
  variant: TabsVariant;
  renderTab: ((tab: Tab, state: { isActive: boolean; isDisabled: boolean }) => React.ReactNode) | undefined;
}

const TabsItem = React.memo(function TabsItem({
  tab,
  isActive,
  isDisabled,
  onSelect,
  color,
  inactiveColor,
  activeBackgroundColor,
  inactiveBackgroundColor,
  variant,
  renderTab,
}: TabsItemProps): React.ReactElement {
  const colors = useColors();
  const mouseTarget = useMouseTarget({
    disabled: isDisabled,
    onMouse: (event) => {
      if (event.button !== "left" || event.action !== "press") return;
      onSelect();
    },
  });

  const child = renderTab
    ? renderTab(tab, { isActive, isDisabled })
    : React.createElement(
      "tui-text",
      {
        color: isDisabled ? colors.text.disabled : isActive ? color : inactiveColor,
        bold: isActive && !isDisabled,
        dim: !isActive || isDisabled,
        ...(isActive && activeBackgroundColor !== undefined ? { backgroundColor: activeBackgroundColor } : {}),
        ...(!isActive && !isDisabled && inactiveBackgroundColor !== undefined ? { backgroundColor: inactiveBackgroundColor } : {}),
      },
      getTabLabelText(tab, variant),
    );

  return React.createElement(
    "tui-box",
    { key: tab.key, ...mouseTarget.targetProps, flexDirection: "row" },
    child,
  );
});

const TabsBase = React.memo(function Tabs(rawProps: TabsProps): React.ReactElement {
  const colors = useColors();
  const props = usePluginProps("Tabs", rawProps);
  const {
    tabs,
    activeKey,
    onChange,
    onClose,
    color = colors.brand.primary,
    inactiveColor = colors.text.dim,
    activeBackgroundColor,
    inactiveBackgroundColor,
    isFocused = true,
    orientation = "horizontal",
    variant = "bracket",
    enableArrows = true,
    enableNumbers = true,
    enableCloseKeys = true,
  } = props;

  const layoutProps = pickStyleProps(props);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const activeKeyRef = useRef(activeKey);
  activeKeyRef.current = activeKey;

  const handleInput = useCallback((event: KeyEvent) => {
    const currentTabs = tabsRef.current;
    const cb = onChangeRef.current;
    if (!cb || currentTabs.length === 0) return;

    const currentIndex = currentTabs.findIndex((t) => t.key === activeKeyRef.current);
    const idx = currentIndex >= 0 ? currentIndex : 0;

    // Navigation keys depend on orientation
    const prevKey = orientation === "vertical" ? "up" : "left";
    const nextKey = orientation === "vertical" ? "down" : "right";

    if (enableArrows && event.key === prevKey) {
      const next = findNextTab(currentTabs, idx, -1);
      if (next >= 0) cb(currentTabs[next]!.key);
    } else if (enableArrows && event.key === nextKey) {
      const next = findNextTab(currentTabs, idx, 1);
      if (next >= 0) cb(currentTabs[next]!.key);
    } else if (enableNumbers && event.char && /^[1-9]$/.test(event.char)) {
      const numIdx = parseInt(event.char, 10) - 1;
      if (numIdx < currentTabs.length && !currentTabs[numIdx]!.disabled) {
        cb(currentTabs[numIdx]!.key);
      }
    } else if (enableCloseKeys && (event.key === "delete" || event.key === "backspace") && onCloseRef.current) {
      const activeTab = currentTabs[idx];
      if (activeTab && activeTab.closable) {
        onCloseRef.current(activeTab.key);
      }
    }
  }, [enableArrows, enableCloseKeys, enableNumbers, orientation]);

  useInput(handleInput, { isActive: isFocused !== false });

  const tabElements = tabs.map((tab) => {
    const isActive = tab.key === activeKey;
    const isDisabled = tab.disabled === true;
    return React.createElement(TabsItem, {
      key: tab.key,
      tab,
      isActive,
      isDisabled,
      onSelect: () => {
        if (!isDisabled) onChangeRef.current?.(tab.key);
      },
      color,
      inactiveColor,
      activeBackgroundColor,
      inactiveBackgroundColor,
      variant,
      renderTab: props.renderTab,
    });
  });

  // Add separators between tabs
  const children: React.ReactElement[] = [];
  const useSeparators = orientation !== "vertical"
    && (((layoutProps as Record<string, unknown>)["gap"] as number | undefined) ?? 0) === 0;
  for (let i = 0; i < tabElements.length; i++) {
    children.push(tabElements[i]!);
    if (useSeparators && i < tabElements.length - 1) {
      children.push(
        React.createElement("tui-text", { key: `sep-${i}` }, " "),
      );
    }
  }

  const outerBoxProps: Record<string, unknown> = {
    role: "tablist",
    flexDirection: orientation === "vertical" ? "column" : "row",
    "aria-label": props["aria-label"],
    ...layoutProps,
  };

  return React.createElement(
    "tui-box",
    outerBoxProps,
    ...children,
  );
});

export const Tabs = Object.assign(TabsBase, {
  Root: TabsRoot,
  Trigger: TabsTrigger,
  Panel: TabsPanel,
});
