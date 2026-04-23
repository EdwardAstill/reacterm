import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
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
    renderTab?: (tab: Tab, state: {
        isActive: boolean;
        isDisabled: boolean;
    }) => React.ReactNode;
}
export interface TabsContextValue {
    activeKey: string;
    setActiveKey: (key: string) => void;
    orientation: "horizontal" | "vertical";
}
export declare const TabsContext: React.Context<TabsContextValue | null>;
export declare function useTabsContext(): TabsContextValue;
export interface TabsRootProps {
    activeKey: string;
    onActiveKeyChange?: (key: string) => void;
    orientation?: "horizontal" | "vertical";
    children: React.ReactNode;
}
declare function TabsRoot({ activeKey, onActiveKeyChange, orientation, children }: TabsRootProps): React.ReactElement;
export interface TabsTriggerProps {
    tabKey: string;
    disabled?: boolean;
    closable?: boolean;
    children?: React.ReactNode;
    color?: string | number;
}
declare function TabsTrigger({ tabKey, disabled, closable, children, color: triggerColor }: TabsTriggerProps): React.ReactElement;
export interface TabsPanelProps {
    tabKey: string;
    children: React.ReactNode;
}
declare function TabsPanel({ tabKey, children }: TabsPanelProps): React.ReactElement | null;
export declare const Tabs: React.NamedExoticComponent<TabsProps> & {
    Root: typeof TabsRoot;
    Trigger: typeof TabsTrigger;
    Panel: typeof TabsPanel;
};
export {};
//# sourceMappingURL=Tabs.d.ts.map