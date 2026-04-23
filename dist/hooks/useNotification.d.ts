export interface Notification {
    id: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    durationMs?: number;
}
export interface UseNotificationOptions {
    maxVisible?: number;
    defaultDuration?: number;
}
export interface UseNotificationResult {
    notifications: readonly Notification[];
    add: (message: string, type?: Notification["type"], durationMs?: number) => string;
    remove: (id: string) => void;
    clear: () => void;
}
export declare function useNotification(options?: UseNotificationOptions): UseNotificationResult;
//# sourceMappingURL=useNotification.d.ts.map