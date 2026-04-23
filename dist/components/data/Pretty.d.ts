import React from "react";
export interface PrettyProps {
    data: unknown;
    indent?: number;
    color?: boolean;
    maxDepth?: number;
    /** Enable interactive mode: collapse/expand objects and arrays. */
    interactive?: boolean;
    /** Whether the component is focused for keyboard navigation. */
    isFocused?: boolean;
    /** When provided, highlight all matching text (case-insensitive) in the JSON output with inverse styling. */
    searchQuery?: string;
    /** Custom value renderer. Return null to use default rendering. */
    renderValue?: (value: unknown, path: string, depth: number) => React.ReactNode | null;
}
export interface PrettyContextValue {
    collapsedPaths: ReadonlySet<string>;
    toggleCollapsed: (path: string) => void;
    cursor: number;
    setCursor: (index: number) => void;
}
export declare const PrettyContext: React.Context<PrettyContextValue | null>;
export declare function usePrettyContext(): PrettyContextValue;
export interface PrettyRootProps {
    collapsedPaths?: ReadonlySet<string>;
    onToggleCollapsed?: (path: string) => void;
    cursor?: number;
    onCursorChange?: (index: number) => void;
    children: React.ReactNode;
}
declare function PrettyRoot({ collapsedPaths, onToggleCollapsed, cursor, onCursorChange, children, }: PrettyRootProps): React.ReactElement;
export interface PrettyCompoundNodeProps {
    text: string;
    path?: string;
    collapsible?: boolean;
    isCollapsed?: boolean;
    color?: string;
    bold?: boolean;
    children?: React.ReactNode;
}
declare function PrettyCompoundNode({ text, path, collapsible, isCollapsed, color, bold, children }: PrettyCompoundNodeProps): React.ReactElement;
export declare const Pretty: React.NamedExoticComponent<PrettyProps> & {
    Root: typeof PrettyRoot;
    Node: typeof PrettyCompoundNode;
};
export {};
//# sourceMappingURL=Pretty.d.ts.map