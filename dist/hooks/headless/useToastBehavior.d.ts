export interface ToastBehaviorItem {
    id: string;
    message: string;
    type?: "info" | "success" | "warning" | "error";
    durationMs?: number;
}
export interface UseToastBehaviorOptions {
    /** Maximum number of visible toasts (default 3) */
    maxVisible?: number;
    /** Default duration for auto-dismiss in ms (default 0 = no auto-dismiss) */
    defaultDurationMs?: number;
}
export interface UseToastBehaviorResult {
    /** Current toast queue (newest last) */
    toasts: readonly ToastBehaviorItem[];
    /** Visible toasts (capped at maxVisible, newest last) */
    visibleToasts: readonly ToastBehaviorItem[];
    /** Add a new toast to the queue */
    addToast: (message: string, opts?: {
        type?: "info" | "success" | "warning" | "error";
        durationMs?: number;
        id?: string;
    }) => string;
    /** Remove a toast by its ID */
    removeToast: (id: string) => void;
    /** Clear all toasts */
    clearAll: () => void;
}
export declare function useToastBehavior(options?: UseToastBehaviorOptions): UseToastBehaviorResult;
//# sourceMappingURL=useToastBehavior.d.ts.map