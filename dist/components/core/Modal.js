import React, { useRef, useCallback, createContext, useContext } from "react";
import { useTui } from "../../context/TuiContext.js";
import { useInput } from "../../hooks/useInput.js";
import { FocusGroup } from "./FocusGroup.js";
import { useColors } from "../../hooks/useColors.js";
import { INPUT_PRIORITY } from "../../input/priorities.js";
import { mergeBoxStyles, pickStyleProps } from "../../styles/applyStyles.js";
import { DEFAULTS } from "../../styles/defaults.js";
import { usePersonality } from "../../core/personality.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
let nextModalId = 0;
export const ModalContext = createContext(null);
export function useModalContext() {
    const ctx = useContext(ModalContext);
    if (!ctx)
        throw new Error("Modal sub-components must be used inside Modal.Root");
    return ctx;
}
/**
 * Registers Escape-to-close + Tab/Shift+Tab focus cycling at the Modal priority
 * (1000). Consumes only those keys — typing keys still reach child inputs.
 * Also returns a stable per-instance group id for the FocusGroup wrapper.
 */
function useModalFocusTrap(visible, onClose) {
    const { focus } = useTui();
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const groupIdRef = useRef(`modal-${nextModalId++}`);
    const handleInput = useCallback((event) => {
        if (event.key === "escape") {
            event.consumed = true;
            onCloseRef.current?.();
            return;
        }
        if (event.key === "tab") {
            event.consumed = true;
            if (event.shift)
                focus.cyclePrev();
            else
                focus.cycleNext();
            return;
        }
    }, [focus]);
    useInput(handleInput, { isActive: visible, priority: INPUT_PRIORITY.MODAL });
    return groupIdRef.current;
}
/**
 * Wrap modal body content in the standard tui-overlay + focus-trapped
 * FocusGroup layers. Keeps ModalRoot and ModalBase in lock-step.
 */
function renderModalShell(overlayProps, groupId, body) {
    return React.createElement("tui-overlay", overlayProps, React.createElement(FocusGroup, { id: groupId, trap: true, direction: "vertical" }, body));
}
function ModalRoot({ visible, onClose, size = "md", children }) {
    const personality = usePersonality();
    const { screen } = useTui();
    const groupId = useModalFocusTrap(visible, onClose);
    if (!visible)
        return null;
    const sizeWidth = getModalWidth(size, screen.width);
    const ctx = { visible, onClose, size };
    const overlayProps = {
        visible: true,
        position: "center",
        ...DEFAULTS.modal,
        borderStyle: personality.borders.panel,
        width: sizeWidth,
        borderColor: personality.colors.brand.primary,
    };
    return renderModalShell(overlayProps, groupId, React.createElement(ModalContext.Provider, { value: ctx }, React.createElement("tui-box", { flexDirection: "column" }, children)));
}
function ModalTitle({ children }) {
    const colors = useColors();
    return React.createElement("tui-text", { bold: true, color: colors.text.primary }, children);
}
function ModalBody({ children }) {
    return React.createElement("tui-box", { flexDirection: "column", marginTop: 1 }, children);
}
function ModalFooter({ children }) {
    return React.createElement("tui-box", { flexDirection: "row", marginTop: 1 }, children);
}
const SIZE_WIDTHS = {
    sm: 30,
    md: 50,
    lg: 70,
};
/** Resolve a ModalSize preset to a pixel/column width for the given screen. */
function getModalWidth(size, screenWidth) {
    if (size === "full")
        return Math.max(1, screenWidth - 4);
    return SIZE_WIDTHS[size] ?? DEFAULTS.modal.width;
}
const ModalBase = React.memo(function Modal(rawProps) {
    const colors = useColors();
    const props = usePluginProps("Modal", rawProps);
    const personality = usePersonality();
    const { visible, title, children, onClose, size = "md", } = props;
    const { screen } = useTui();
    const userStyles = pickStyleProps(props);
    const sizeWidth = getModalWidth(size, screen.width);
    const width = userStyles.width ?? sizeWidth;
    const groupId = useModalFocusTrap(visible, onClose);
    if (!visible)
        return null;
    const contentChildren = [];
    // Title bar
    if (title) {
        if (props.renderTitle) {
            contentChildren.push(React.createElement(React.Fragment, { key: "title" }, props.renderTitle(title)));
        }
        else {
            contentChildren.push(React.createElement("tui-text", { key: "title", bold: true, color: colors.text.primary }, title));
        }
        // Divider line below title — subtract padding (paddingX defaults from DEFAULTS.modal)
        const padding = (userStyles.padding ?? DEFAULTS.modal.padding) ?? 0;
        const paddingX = (userStyles.paddingX ?? DEFAULTS.modal.paddingX) ?? padding;
        const dividerWidth = Math.max(1, width - paddingX * 2);
        contentChildren.push(React.createElement("tui-text", { key: "divider", color: colors.divider }, "\u2500".repeat(dividerWidth)));
    }
    // Children content
    contentChildren.push(React.createElement("tui-box", { key: "body", flexDirection: "column", marginTop: title ? 1 : 0 }, children));
    // Esc to close hint
    if (onClose) {
        contentChildren.push(React.createElement("tui-text", { key: "esc-hint", dim: true, color: colors.text.dim, marginTop: 1 }, "[Esc to close]"));
    }
    const overlayProps = mergeBoxStyles({
        visible: true,
        position: "center",
        ...DEFAULTS.modal,
        borderStyle: personality.borders.panel,
        width,
        borderColor: personality.colors.brand.primary,
        role: "dialog",
    }, userStyles);
    return renderModalShell(overlayProps, groupId, React.createElement("tui-box", { flexDirection: "column" }, ...contentChildren));
});
export const Modal = Object.assign(ModalBase, {
    Root: ModalRoot,
    Title: ModalTitle,
    Body: ModalBody,
    Footer: ModalFooter,
});
//# sourceMappingURL=Modal.js.map