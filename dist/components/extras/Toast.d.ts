import React from "react";
import type { StormContainerStyleProps } from "../../styles/styleProps.js";
export interface ToastProps extends StormContainerStyleProps {
    message: string;
    type?: "info" | "success" | "warning" | "error";
    visible?: boolean;
    durationMs?: number;
    /** Called when the auto-hide timer fires. */
    onDismiss?: () => void;
    /** Enable slide-in entrance and dim-out exit animation (~120ms). */
    animated?: boolean;
    /** Custom render for the toast content. */
    renderContent?: (message: string, type: string, icon: string) => React.ReactNode;
}
export interface ToastItem {
    id: string;
    message: string;
    type?: "info" | "success" | "warning" | "error";
    durationMs?: number;
}
export interface ToastContainerProps extends Omit<StormContainerStyleProps, "position"> {
    /** Stack of toast items to display. */
    toasts: ToastItem[];
    /** Position of the toast stack: "top" or "bottom" (default "bottom"). */
    position?: "top" | "bottom";
    /** Maximum number of visible toasts (default 3). */
    maxVisible?: number;
    /** Called when an individual toast auto-dismisses. */
    onDismiss?: (id: string) => void;
}
export interface ToastQueueContextValue {
    toasts: ToastItem[];
    addToast: (toast: ToastItem) => void;
    removeToast: (id: string) => void;
}
export declare const ToastQueueContext: React.Context<ToastQueueContextValue | null>;
export declare function useToastQueueContext(): ToastQueueContextValue;
export interface ToastProviderProps {
    maxVisible?: number;
    position?: "top" | "bottom";
    children: React.ReactNode;
}
declare function ToastProvider({ maxVisible, position, children }: ToastProviderProps): React.ReactElement;
export interface ToastCompoundItemProps {
    id: string;
    message: string;
    type?: "info" | "success" | "warning" | "error";
    durationMs?: number;
}
declare function ToastCompoundItem({ id, message, type, durationMs }: ToastCompoundItemProps): React.ReactElement | null;
export declare const ToastContainer: React.NamedExoticComponent<ToastContainerProps>;
export declare const Toast: React.NamedExoticComponent<ToastProps> & {
    Provider: typeof ToastProvider;
    Item: typeof ToastCompoundItem;
};
export {};
//# sourceMappingURL=Toast.d.ts.map