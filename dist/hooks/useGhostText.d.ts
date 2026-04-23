export interface UseGhostTextOptions {
    value: string;
    cursor: number;
    suggest: ((value: string) => string | null) | string[];
    acceptKey?: string;
    debounceMs?: number;
}
export interface UseGhostTextResult {
    ghost: string;
    accept: () => string | null;
    dismiss: () => void;
}
export declare function useGhostText(options: UseGhostTextOptions): UseGhostTextResult;
//# sourceMappingURL=useGhostText.d.ts.map