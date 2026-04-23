import React from "react";
import type { StormContainerStyleProps } from "../../styles/styleProps.js";
export interface ConfirmDialogAction {
    label: string;
    key: string;
    action: () => void;
    variant?: "primary" | "danger" | "default";
}
export interface ConfirmDialogProps extends StormContainerStyleProps {
    visible: boolean;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: "info" | "warning" | "danger";
    /** If set, auto-fire timeoutAction after this many milliseconds. */
    timeoutMs?: number;
    /** Action to fire on timeout — defaults to "cancel". */
    timeoutAction?: "confirm" | "cancel";
    /** Multiple action buttons. When provided, overrides confirm/cancel buttons. */
    actions?: ConfirmDialogAction[];
}
export interface ConfirmDialogContextValue {
    visible: boolean;
    type: "info" | "warning" | "danger";
    onConfirm: (() => void) | undefined;
    onCancel: (() => void) | undefined;
    focusedActionIndex: number;
    setFocusedActionIndex: (index: number) => void;
}
export declare const ConfirmDialogContext: React.Context<ConfirmDialogContextValue | null>;
export declare function useConfirmDialogContext(): ConfirmDialogContextValue;
export interface ConfirmDialogRootProps {
    visible: boolean;
    type?: "info" | "warning" | "danger";
    onConfirm?: () => void;
    onCancel?: () => void;
    focusedActionIndex?: number;
    onFocusedActionChange?: (index: number) => void;
    children: React.ReactNode;
}
declare function ConfirmDialogRoot({ visible, type, onConfirm, onCancel, focusedActionIndex, onFocusedActionChange, children, }: ConfirmDialogRootProps): React.ReactElement | null;
export interface ConfirmDialogCompoundMessageProps {
    children: React.ReactNode;
}
declare function ConfirmDialogCompoundMessage({ children }: ConfirmDialogCompoundMessageProps): React.ReactElement;
export interface ConfirmDialogCompoundActionsProps {
    children: React.ReactNode;
}
declare function ConfirmDialogCompoundActions({ children }: ConfirmDialogCompoundActionsProps): React.ReactElement;
export declare const ConfirmDialog: React.NamedExoticComponent<ConfirmDialogProps> & {
    Root: typeof ConfirmDialogRoot;
    Message: typeof ConfirmDialogCompoundMessage;
    Actions: typeof ConfirmDialogCompoundActions;
};
export {};
//# sourceMappingURL=ConfirmDialog.d.ts.map