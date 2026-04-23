export type DialogSize = "sm" | "md" | "lg" | "full";
export interface UseDialogBehaviorOptions {
    visible?: boolean;
    onClose?: () => void;
    size?: DialogSize;
    /** Focus trap priority (default 1000, matching Modal) */
    trapPriority?: number;
}
export interface UseDialogBehaviorResult {
    /** Whether the dialog is currently visible */
    isVisible: boolean;
    /** Show the dialog */
    show: () => void;
    /** Hide the dialog */
    hide: () => void;
    /** Resolved width based on size */
    resolvedWidth: number;
    /** Props for the dialog container (overlay) */
    dialogProps: {
        visible: boolean;
        role: string;
    };
    /** Props for the dialog content area */
    contentProps: {
        role: string;
    };
}
export declare function useDialogBehavior(options: UseDialogBehaviorOptions): UseDialogBehaviorResult;
//# sourceMappingURL=useDialogBehavior.d.ts.map