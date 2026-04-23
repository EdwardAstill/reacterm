import React from "react";
import type { StormContainerStyleProps } from "../../styles/styleProps.js";
export interface AlertAction {
    label: string;
    onAction: () => void;
}
export interface AlertProps extends StormContainerStyleProps {
    children: React.ReactNode;
    type?: "success" | "warning" | "error" | "info";
    title?: string;
    /** When true, show an "x" close indicator and handle Escape to call onClose. */
    closable?: boolean;
    /** Called when the alert is dismissed (via Escape key or close indicator). */
    onClose?: () => void;
    /** Action link rendered after the message. */
    action?: AlertAction;
    /** Whether this alert is focused and receives keyboard input (default true when closable). */
    isFocused?: boolean;
    /** Custom render for the alert type icon. */
    renderIcon?: (type: string, icon: string) => React.ReactNode;
}
export interface AlertContextValue {
    type: "success" | "warning" | "error" | "info";
    typeColor: string;
    closable: boolean;
    onClose: (() => void) | undefined;
}
export declare const AlertContext: React.Context<AlertContextValue | null>;
export declare function useAlertContext(): AlertContextValue;
export interface AlertRootProps {
    type?: "success" | "warning" | "error" | "info";
    closable?: boolean;
    onClose?: () => void;
    children: React.ReactNode;
}
declare function AlertRoot({ type, closable, onClose, children }: AlertRootProps): React.ReactElement;
export interface AlertIconProps {
    children?: React.ReactNode;
}
declare function AlertIcon({ children }: AlertIconProps): React.ReactElement;
export interface AlertCompoundTitleProps {
    children: React.ReactNode;
}
declare function AlertCompoundTitle({ children }: AlertCompoundTitleProps): React.ReactElement;
export interface AlertCompoundBodyProps {
    children: React.ReactNode;
}
declare function AlertCompoundBody({ children }: AlertCompoundBodyProps): React.ReactElement;
export interface AlertCompoundActionProps {
    label: string;
    onAction?: () => void;
    children?: React.ReactNode;
}
declare function AlertCompoundAction({ label, onAction, children }: AlertCompoundActionProps): React.ReactElement;
export declare const Alert: React.NamedExoticComponent<AlertProps> & {
    Root: typeof AlertRoot;
    Icon: typeof AlertIcon;
    Title: typeof AlertCompoundTitle;
    Body: typeof AlertCompoundBody;
    Action: typeof AlertCompoundAction;
};
export {};
//# sourceMappingURL=Alert.d.ts.map