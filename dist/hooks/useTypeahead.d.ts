export interface UseTypeaheadOptions {
    items: string[];
    onMatch: (index: number) => void;
    isActive?: boolean;
    resetMs?: number;
}
export interface UseTypeaheadResult {
    typed: string;
    reset: () => void;
}
export declare function useTypeahead(options: UseTypeaheadOptions): UseTypeaheadResult;
//# sourceMappingURL=useTypeahead.d.ts.map