export interface HotkeyDef {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    meta?: boolean;
    label: string;
    action: () => void;
}
export interface UseHotkeyOptions {
    hotkeys: HotkeyDef[];
    isActive?: boolean;
}
export interface UseHotkeyResult {
    /** All registered hotkeys with their labels — for rendering a help bar */
    bindings: Array<{
        label: string;
        description: string;
    }>;
}
export declare function useHotkey(options: UseHotkeyOptions): UseHotkeyResult;
//# sourceMappingURL=useHotkey.d.ts.map