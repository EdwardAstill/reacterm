import React from "react";
export interface DirNode {
    name: string;
    path: string;
    isDir: boolean;
    children?: DirNode[];
    expanded?: boolean;
}
/** Entry descriptor returned by onLoadChildren. */
export interface DirChildEntry {
    name: string;
    isDirectory: boolean;
}
export interface DirectoryTreeProps {
    rootPath: string;
    onSelect?: (path: string) => void;
    showHidden?: boolean;
    showFiles?: boolean;
    fileColor?: string | number;
    dirColor?: string | number;
    isFocused?: boolean;
    /** Custom renderer for each directory entry. */
    renderEntry?: (entry: DirNode, state: {
        isHighlighted: boolean;
        isExpanded: boolean;
        depth: number;
    }) => React.ReactNode;
    /** Custom async child loader. When provided, replaces the default sync fs.readdirSync.
     *  Return an array of { name: string, isDirectory: boolean } entries. */
    onLoadChildren?: (path: string) => DirChildEntry[] | Promise<DirChildEntry[]>;
}
export interface DirectoryTreeContextValue {
    expandedPaths: ReadonlySet<string>;
    toggleExpanded: (path: string) => void;
    cursor: number;
    setCursor: (index: number) => void;
}
export declare const DirectoryTreeContext: React.Context<DirectoryTreeContextValue | null>;
export declare function useDirectoryTreeContext(): DirectoryTreeContextValue;
export interface DirectoryTreeRootProps {
    expandedPaths?: ReadonlySet<string>;
    onToggleExpanded?: (path: string) => void;
    cursor?: number;
    onCursorChange?: (index: number) => void;
    children: React.ReactNode;
}
declare function DirectoryTreeRoot({ expandedPaths, onToggleExpanded, cursor, onCursorChange, children, }: DirectoryTreeRootProps): React.ReactElement;
export interface DirectoryTreeCompoundNodeProps {
    node: DirNode;
    depth?: number;
    index?: number;
    children?: React.ReactNode;
}
declare function DirectoryTreeCompoundNode({ node, depth, index, children }: DirectoryTreeCompoundNodeProps): React.ReactElement;
export declare const DirectoryTree: React.NamedExoticComponent<DirectoryTreeProps> & {
    Root: typeof DirectoryTreeRoot;
    Node: typeof DirectoryTreeCompoundNode;
};
export {};
//# sourceMappingURL=DirectoryTree.d.ts.map