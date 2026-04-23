import React from "react";
import type { StormContainerStyleProps } from "../../styles/styleProps.js";
export interface AccordionSection {
    title: string;
    content: React.ReactNode;
    key: string;
}
export interface AccordionProps extends StormContainerStyleProps {
    sections: AccordionSection[];
    activeKeys?: string[];
    onToggle?: (key: string) => void;
    exclusive?: boolean;
    /** Enable animated height transitions (~150ms). */
    animated?: boolean;
    /**
     * Whether the accordion captures keyboard input (default true).
     * When false, Up/Down/Enter/Space keys are not consumed — useful when
     * the Accordion is inside a ScrollView and should let scroll keys through
     * until the user explicitly focuses the Accordion.
     */
    isFocused?: boolean;
    /** Custom renderer for section headers. */
    renderSectionHeader?: (props: {
        key: string;
        title: string;
        expanded: boolean;
        focused: boolean;
    }) => React.ReactNode;
}
export interface AccordionContextValue {
    activeKeys: string[];
    toggle: (key: string) => void;
    exclusive: boolean;
}
export declare const AccordionContext: React.Context<AccordionContextValue | null>;
export declare function useAccordionContext(): AccordionContextValue;
export interface AccordionSectionContextValue {
    sectionKey: string;
    isExpanded: boolean;
}
export declare const AccordionSectionContext: React.Context<AccordionSectionContextValue | null>;
export declare function useAccordionSectionContext(): AccordionSectionContextValue;
export interface AccordionRootProps {
    activeKeys?: string[];
    onToggle?: (key: string) => void;
    exclusive?: boolean;
    children: React.ReactNode;
}
declare function AccordionRoot({ activeKeys, onToggle, exclusive, children }: AccordionRootProps): React.ReactElement;
export interface AccordionCompoundSectionProps {
    sectionKey: string;
    children: React.ReactNode;
}
declare function AccordionCompoundSection({ sectionKey, children }: AccordionCompoundSectionProps): React.ReactElement;
export interface AccordionCompoundHeaderProps {
    children?: React.ReactNode;
}
declare function AccordionCompoundHeader({ children }: AccordionCompoundHeaderProps): React.ReactElement;
export interface AccordionCompoundContentProps {
    children: React.ReactNode;
}
declare function AccordionCompoundContent({ children }: AccordionCompoundContentProps): React.ReactElement | null;
export declare const Accordion: React.NamedExoticComponent<AccordionProps> & {
    Root: typeof AccordionRoot;
    Section: typeof AccordionCompoundSection;
    Header: typeof AccordionCompoundHeader;
    Content: typeof AccordionCompoundContent;
};
export {};
//# sourceMappingURL=Accordion.d.ts.map