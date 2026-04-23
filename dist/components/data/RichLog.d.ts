import React from "react";
import type { StormContainerStyleProps } from "../../styles/styleProps.js";
export type LogLevel = "debug" | "info" | "warn" | "error";
export interface LogEntry {
    text: string;
    color?: string | number;
    dim?: boolean;
    bold?: boolean;
    timestamp?: string;
    /** Log level for filtering and color coding. */
    level?: LogLevel;
}
export interface RichLogProps extends StormContainerStyleProps {
    entries: readonly LogEntry[];
    maxVisible?: number;
    autoScroll?: boolean;
    showTimestamp?: boolean;
    timestampColor?: string | number;
    isFocused?: boolean;
    /** Only show entries at or above this level. */
    filterLevel?: LogLevel;
    /** When provided, highlights matching text in log entries and enables Ctrl+N/Ctrl+P navigation. */
    searchQuery?: string;
    /** Custom render for each log entry. */
    renderEntry?: (entry: LogEntry, state: {
        isMatch: boolean;
    }) => React.ReactNode;
}
export interface RichLogContextValue {
    scrollOffset: number;
    setScrollOffset: (offset: number) => void;
    filterLevel: LogLevel | undefined;
    searchQuery: string | undefined;
}
export declare const RichLogContext: React.Context<RichLogContextValue | null>;
export declare function useRichLogContext(): RichLogContextValue;
export interface RichLogRootProps {
    scrollOffset?: number;
    onScrollChange?: (offset: number) => void;
    filterLevel?: LogLevel;
    searchQuery?: string;
    children: React.ReactNode;
}
declare function RichLogRoot({ scrollOffset, onScrollChange, filterLevel, searchQuery, children, }: RichLogRootProps): React.ReactElement;
export interface RichLogCompoundEntryProps {
    entry: LogEntry;
    index?: number;
    children?: React.ReactNode;
}
declare function RichLogCompoundEntry({ entry, index, children }: RichLogCompoundEntryProps): React.ReactElement;
export declare const RichLog: React.NamedExoticComponent<RichLogProps> & {
    Root: typeof RichLogRoot;
    Entry: typeof RichLogCompoundEntry;
};
export {};
//# sourceMappingURL=RichLog.d.ts.map