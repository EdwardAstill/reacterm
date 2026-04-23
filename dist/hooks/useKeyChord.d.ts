export interface KeyChordDef {
    first: {
        key: string;
        ctrl?: boolean;
        shift?: boolean;
        meta?: boolean;
    };
    second: {
        key: string;
        ctrl?: boolean;
        shift?: boolean;
        meta?: boolean;
    };
    label: string;
    action: () => void;
}
export interface UseKeyChordOptions {
    chords: KeyChordDef[];
    isActive?: boolean;
    timeoutMs?: number;
}
export interface UseKeyChordResult {
    /** Currently waiting for second key (first key was pressed) */
    pendingChord: string | null;
    bindings: Array<{
        label: string;
    }>;
}
export declare function useKeyChord(options: UseKeyChordOptions): UseKeyChordResult;
//# sourceMappingURL=useKeyChord.d.ts.map