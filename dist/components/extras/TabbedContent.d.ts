import React from "react";
import type { StormContainerStyleProps } from "../../styles/styleProps.js";
export interface TabbedContentProps extends StormContainerStyleProps {
    tabs: Array<{
        label: string;
        key: string;
    }>;
    activeKey: string;
    onTabChange?: (key: string) => void;
    children: React.ReactNode;
    tabColor?: string | number;
    activeTabColor?: string | number;
    /**
     * Whether the TabbedContent captures keyboard input (default true).
     * When false, Left/Right arrow keys and number keys are not consumed —
     * useful when nested inside a Modal or another component that manages focus.
     */
    isFocused?: boolean;
}
export interface TabbedContentContextValue {
    activeKey: string;
    setActiveKey: (key: string) => void;
    tabColor: string | number;
    activeTabColor: string | number;
}
export declare const TabbedContentContext: React.Context<TabbedContentContextValue | null>;
export declare function useTabbedContentContext(): TabbedContentContextValue;
export interface TabbedContentRootProps {
    activeKey: string;
    onTabChange?: (key: string) => void;
    tabColor?: string | number;
    activeTabColor?: string | number;
    children: React.ReactNode;
}
declare function TabbedContentRoot({ activeKey, onTabChange, tabColor: tabColorProp, activeTabColor: activeTabColorProp, children, }: TabbedContentRootProps): React.ReactElement;
export interface TabbedContentTabProps {
    tabKey: string;
    label?: string;
    children?: React.ReactNode;
}
declare function TabbedContentTab({ tabKey, label, children }: TabbedContentTabProps): React.ReactElement;
export interface TabbedContentPanelProps {
    tabKey: string;
    children: React.ReactNode;
}
declare function TabbedContentPanel({ tabKey, children }: TabbedContentPanelProps): React.ReactElement | null;
export declare const TabbedContent: React.NamedExoticComponent<TabbedContentProps> & {
    Root: typeof TabbedContentRoot;
    Tab: typeof TabbedContentTab;
    Panel: typeof TabbedContentPanel;
};
export {};
//# sourceMappingURL=TabbedContent.d.ts.map