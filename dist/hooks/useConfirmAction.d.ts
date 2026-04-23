export interface UseConfirmActionOptions {
    isActive?: boolean;
    timeoutMs?: number;
}
export interface UseConfirmActionResult {
    isPending: boolean;
    confirm: () => void;
    cancel: () => void;
    /** Call this to start confirmation flow. Returns a promise that resolves true (confirmed) or false (cancelled). */
    requestConfirm: () => Promise<boolean>;
    countdown: number | null;
}
export declare function useConfirmAction(options?: UseConfirmActionOptions): UseConfirmActionResult;
//# sourceMappingURL=useConfirmAction.d.ts.map