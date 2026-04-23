import React from "react";
import type { StormContainerStyleProps } from "../../styles/styleProps.js";
export interface ModalContextValue {
    visible: boolean;
    onClose: (() => void) | undefined;
    size: ModalSize;
}
export declare const ModalContext: React.Context<ModalContextValue | null>;
export declare function useModalContext(): ModalContextValue;
export interface ModalRootProps {
    visible: boolean;
    onClose?: () => void;
    size?: ModalSize;
    children: React.ReactNode;
}
declare function ModalRoot({ visible, onClose, size, children }: ModalRootProps): React.ReactElement | null;
export interface ModalTitleProps {
    children: React.ReactNode;
}
declare function ModalTitle({ children }: ModalTitleProps): React.ReactElement;
export interface ModalBodyProps {
    children: React.ReactNode;
}
declare function ModalBody({ children }: ModalBodyProps): React.ReactElement;
export interface ModalFooterProps {
    children: React.ReactNode;
}
declare function ModalFooter({ children }: ModalFooterProps): React.ReactElement;
export type ModalSize = "sm" | "md" | "lg" | "full";
export interface ModalProps extends StormContainerStyleProps {
    visible: boolean;
    title?: string;
    children: React.ReactNode;
    onClose?: () => void;
    /** Size preset: "sm" (30), "md" (50, default), "lg" (70), "full" (screen width - 4). */
    size?: ModalSize;
    /** Custom render for the modal title. */
    renderTitle?: (title: string) => React.ReactNode;
}
export declare const Modal: React.NamedExoticComponent<ModalProps> & {
    Root: typeof ModalRoot;
    Title: typeof ModalTitle;
    Body: typeof ModalBody;
    Footer: typeof ModalFooter;
};
export {};
//# sourceMappingURL=Modal.d.ts.map