export interface UseTextCyclerOptions {
    texts: string[];
    intervalMs?: number;
    order?: "sequential" | "random" | "shuffle";
    active?: boolean;
}
export interface UseTextCyclerResult {
    text: string;
    index: number;
    next: () => void;
    reset: () => void;
}
export declare function useTextCycler(options: UseTextCyclerOptions): UseTextCyclerResult;
//# sourceMappingURL=useTextCycler.d.ts.map