import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface PaletteCommand {
    /** Unique identifier for the command. */
    id: string;
    /** Display name shown in the palette. */
    name: string;
    /** Brief description shown dim after the name. */
    description: string;
    /** Category for grouping (e.g. "File", "Edit", "Navigation"). */
    category?: string;
    /** Keyboard shortcut hint (e.g. "Ctrl+S"). Rendered right-aligned and dim. */
    shortcut?: string;
    /** Icon character or emoji rendered before the name. */
    icon?: string;
    /** Whether this command is currently disabled. */
    disabled?: boolean;
}
export interface CommandPaletteContextValue {
    isOpen: boolean;
    query: string;
    filtered: PaletteCommand[];
    activeIndex: number;
    onExecute: (command: PaletteCommand) => void;
    close: () => void;
}
export declare const CommandPaletteContext: React.Context<CommandPaletteContextValue | null>;
export declare function useCommandPaletteContext(): CommandPaletteContextValue;
export interface CommandPaletteRootProps {
    isOpen: boolean;
    onClose: () => void;
    query: string;
    filtered: PaletteCommand[];
    activeIndex: number;
    onExecute: (command: PaletteCommand) => void;
    children: React.ReactNode;
}
declare function CommandPaletteRoot({ isOpen, onClose, query, filtered, activeIndex, onExecute, children, }: CommandPaletteRootProps): React.ReactElement | null;
export interface CommandPaletteInputProps {
    placeholder?: string;
}
declare function CommandPaletteInput({ placeholder }: CommandPaletteInputProps): React.ReactElement;
export interface CommandPaletteListProps {
    children?: React.ReactNode;
    emptyText?: string;
}
declare function CommandPaletteList({ children, emptyText }: CommandPaletteListProps): React.ReactElement;
export interface CommandPaletteItemProps {
    command: PaletteCommand;
    isActive?: boolean;
    children?: React.ReactNode;
}
declare function CommandPaletteItem({ command, isActive, children }: CommandPaletteItemProps): React.ReactElement;
export interface CommandPaletteProps extends StormLayoutStyleProps {
    /** Array of command definitions to display. */
    commands: PaletteCommand[];
    /** Called when a command is selected. */
    onExecute: (command: PaletteCommand) => void;
    /** Key character that opens the palette (default: "/"). */
    trigger?: string;
    /** Whether the component listens for the trigger key (default: true). */
    isActive?: boolean;
    /** Controlled open state. Omit for uncontrolled (trigger key). */
    isOpen?: boolean;
    /** Called when open state changes (for controlled mode). */
    onOpenChange?: (open: boolean) => void;
    /** Maximum visible items before scrolling (default: 10). */
    maxVisible?: number;
    /** Overlay width (default: 60). */
    overlayWidth?: number;
    /** Placeholder text in the search input. */
    placeholder?: string;
    /** Text shown when no commands match the query. */
    emptyText?: string;
    /** ARIA label for the overlay. */
    "aria-label"?: string;
    /** Custom renderer for each command item. */
    renderItem?: (command: PaletteCommand, state: {
        isActive: boolean;
        index: number;
    }) => React.ReactNode;
}
export declare const CommandPalette: React.NamedExoticComponent<CommandPaletteProps> & {
    Root: typeof CommandPaletteRoot;
    Input: typeof CommandPaletteInput;
    List: typeof CommandPaletteList;
    Item: typeof CommandPaletteItem;
};
export {};
//# sourceMappingURL=CommandPalette.d.ts.map