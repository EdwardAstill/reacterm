import React from "react";
export interface FileNode {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileNode[];
}
/** Entry descriptor returned by onLoadEntries. */
export interface FilePickerChildEntry {
    name: string;
    isDirectory: boolean;
}
export interface FilePickerProps {
    files: readonly FileNode[];
    onSelect?: (path: string) => void;
    selectedPath?: string;
    maxVisible?: number;
    isFocused?: boolean;
    color?: string | number;
    /** Only show files with these extensions (e.g. [".ts", ".tsx"]). Directories are always shown. */
    extensions?: string[];
    /** Show file sizes to the right of filenames. */
    showSize?: boolean;
    /** Show last modified date in dim text. */
    showModified?: boolean;
    /** Custom render for each file/directory entry. */
    renderEntry?: (file: FileNode, state: {
        isHighlighted: boolean;
        isExpanded: boolean;
        depth: number;
    }) => React.ReactNode;
    /** Custom async entry loader. When provided, replaces the default sync fs.statSync for metadata.
     *  Called when a directory is expanded to load its children. Return an array of entries. */
    onLoadEntries?: (path: string) => FilePickerChildEntry[] | Promise<FilePickerChildEntry[]>;
    "aria-label"?: string;
}
export interface FilePickerContextValue {
    expandedPaths: ReadonlySet<string>;
    toggleExpanded: (path: string) => void;
    highlightIndex: number;
    setHighlightIndex: (index: number) => void;
    searchFilter: string;
    setSearchFilter: (filter: string) => void;
}
export declare const FilePickerContext: React.Context<FilePickerContextValue | null>;
export declare function useFilePickerContext(): FilePickerContextValue;
export interface FilePickerRootProps {
    children: React.ReactNode;
    expandedPaths?: ReadonlySet<string>;
    onToggleExpanded?: (path: string) => void;
    highlightIndex?: number;
    onHighlightChange?: (index: number) => void;
    searchFilter?: string;
    onSearchFilterChange?: (filter: string) => void;
}
declare function FilePickerRoot({ children, expandedPaths, onToggleExpanded, highlightIndex, onHighlightChange, searchFilter, onSearchFilterChange, }: FilePickerRootProps): React.ReactElement;
export interface FilePickerCompoundEntryProps {
    file: FileNode;
    depth?: number;
    index?: number;
    children?: React.ReactNode;
}
declare function FilePickerEntry({ file, depth, index, children }: FilePickerCompoundEntryProps): React.ReactElement;
export declare const FilePicker: React.NamedExoticComponent<FilePickerProps> & {
    Root: typeof FilePickerRoot;
    Entry: typeof FilePickerEntry;
};
export {};
//# sourceMappingURL=FilePicker.d.ts.map