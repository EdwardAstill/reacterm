export interface CommandDef {
    name: string;
    description: string;
    category?: string;
}
export interface UseCommandPaletteOptions {
    commands: CommandDef[];
    trigger?: string;
    isActive?: boolean;
    onExecute: (command: CommandDef) => void;
}
export interface UseCommandPaletteResult {
    isOpen: boolean;
    query: string;
    filtered: CommandDef[];
    activeIndex: number;
    open: () => void;
    close: () => void;
}
export declare function useCommandPalette(options: UseCommandPaletteOptions): UseCommandPaletteResult;
//# sourceMappingURL=useCommandPalette.d.ts.map