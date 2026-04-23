import React from "react";
import type { StormContainerStyleProps } from "../../styles/styleProps.js";
export interface DiffViewContextValue {
    scrollIndex: number;
    setScrollIndex: (index: number) => void;
    expandedHunks: ReadonlySet<number>;
    toggleHunk: (index: number) => void;
    isFocused: boolean;
}
export declare const DiffViewContext: React.Context<DiffViewContextValue | null>;
export declare function useDiffViewContext(): DiffViewContextValue;
export interface DiffViewRootProps {
    scrollIndex?: number;
    onScrollChange?: (index: number) => void;
    expandedHunks?: ReadonlySet<number>;
    onToggleHunk?: (index: number) => void;
    isFocused?: boolean;
    children: React.ReactNode;
}
declare function DiffViewRoot({ scrollIndex, onScrollChange, expandedHunks, onToggleHunk, isFocused, children, }: DiffViewRootProps): React.ReactElement;
export interface DiffViewCompoundLineProps {
    line: DiffLine;
    index?: number;
    children?: React.ReactNode;
}
declare function DiffViewCompoundLine({ line, index, children }: DiffViewCompoundLineProps): React.ReactElement;
export interface DiffViewCompoundHunkProps {
    header: string;
    children?: React.ReactNode;
}
declare function DiffViewCompoundHunk({ header, children }: DiffViewCompoundHunkProps): React.ReactElement;
export interface DiffLine {
    type: "added" | "removed" | "context" | "header";
    content: string;
    oldLineNumber?: number;
    newLineNumber?: number;
}
export interface DiffViewProps extends StormContainerStyleProps {
    /** Raw unified diff string (output of `git diff` etc.) */
    diff?: string;
    /** Or provide pre-parsed lines */
    lines?: DiffLine[];
    /** Show line numbers (default true) */
    showLineNumbers?: boolean;
    /** Number of context lines to show around changes (default: all) */
    contextLines?: number;
    /** Color for added lines (default: green) */
    addedColor?: string;
    /** Color for removed lines (default: red) */
    removedColor?: string;
    /** When true, enable keyboard navigation */
    isFocused?: boolean;
    /** File path header */
    filePath?: string;
    /** Show word-level diff highlighting within changed lines */
    wordDiff?: boolean;
    /** Custom render for each diff line. */
    renderLine?: (line: DiffLine, state: {
        isHighlighted: boolean;
    }) => React.ReactNode;
}
export declare const DiffView: React.NamedExoticComponent<DiffViewProps> & {
    Root: typeof DiffViewRoot;
    Line: typeof DiffViewCompoundLine;
    Hunk: typeof DiffViewCompoundHunk;
};
export {};
//# sourceMappingURL=DiffView.d.ts.map