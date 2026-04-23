import React, { useRef, createContext, useContext } from "react";
import { useTui } from "../../context/TuiContext.js";
import { useCleanup } from "../../hooks/useCleanup.js";
import { createAnimation, tickAnimation } from "../../utils/animate.js";
import { useColors } from "../../hooks/useColors.js";
import { mergeBoxStyles, pickStyleProps } from "../../styles/applyStyles.js";
import { usePersonality } from "../../core/personality.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
export const ToastQueueContext = createContext(null);
export function useToastQueueContext() {
    const ctx = useContext(ToastQueueContext);
    if (!ctx)
        throw new Error("Toast sub-components must be used inside Toast.Provider");
    return ctx;
}
function ToastProvider({ maxVisible = 5, position = "bottom", children }) {
    const colors = useColors();
    const { requestRender } = useTui();
    const toastsRef = useRef([]);
    const ctx = {
        toasts: toastsRef.current,
        addToast: (toast) => {
            toastsRef.current = [...toastsRef.current, toast];
            requestRender();
        },
        removeToast: (id) => {
            toastsRef.current = toastsRef.current.filter((t) => t.id !== id);
            requestRender();
        },
    };
    const visibleToasts = toastsRef.current.slice(-maxVisible);
    const toastElements = visibleToasts.map((item) => React.createElement(Toast, {
        key: item.id,
        message: item.message,
        ...(item.type !== undefined ? { type: item.type } : {}),
        ...(item.durationMs !== undefined ? { durationMs: item.durationMs } : {}),
        visible: true,
        onDismiss: () => {
            toastsRef.current = toastsRef.current.filter((t) => t.id !== item.id);
            requestRender();
        },
    }));
    const orderedElements = position === "top" ? [...toastElements].reverse() : toastElements;
    return React.createElement(ToastQueueContext.Provider, { value: ctx }, children, React.createElement("tui-box", { flexDirection: "column" }, ...orderedElements));
}
function ToastCompoundItem({ id, message, type = "info", durationMs }) {
    return React.createElement(Toast, {
        message,
        type,
        visible: true,
        ...(durationMs !== undefined ? { durationMs } : {}),
    });
}
function getTypeColors(colors) {
    return {
        info: colors.info,
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
    };
}
const TYPE_ICONS = {
    info: "\u25C6", // ◆
    success: "\u2714", // ✔
    warning: "\u25B2", // ▲
    error: "\u2718", // ✘
};
const ToastBase = React.memo(function Toast(rawProps) {
    const props = usePluginProps("Toast", rawProps);
    const personality = usePersonality();
    const { message, type = "info", visible: visibleProp = true, durationMs = 3000, onDismiss, animated = false, } = props;
    const onDismissRef = useRef(onDismiss);
    onDismissRef.current = onDismiss;
    const { requestRender } = useTui();
    const hiddenRef = useRef(false);
    const timerRef = useRef(null);
    const startedRef = useRef(false);
    // Animation state
    const entranceAnimRef = useRef(null);
    const exitAnimRef = useRef(null);
    const animTimerRef = useRef(null);
    const entranceProgressRef = useRef(animated ? 0 : 1);
    const exitProgressRef = useRef(0);
    const entranceStartedRef = useRef(false);
    // Start entrance animation on first render (when animated)
    if (animated && !entranceStartedRef.current && visibleProp && !hiddenRef.current) {
        entranceStartedRef.current = true;
        entranceAnimRef.current = createAnimation(0, 1, personality.animation.durationFast);
        entranceProgressRef.current = 0;
        if (animTimerRef.current)
            clearInterval(animTimerRef.current);
        animTimerRef.current = setInterval(() => {
            let needsRender = false;
            const entrance = entranceAnimRef.current;
            if (entrance) {
                entranceProgressRef.current = tickAnimation(entrance);
                needsRender = true;
                if (entrance.done) {
                    entranceAnimRef.current = null;
                    if (!exitAnimRef.current && animTimerRef.current) {
                        clearInterval(animTimerRef.current);
                        animTimerRef.current = null;
                    }
                }
            }
            const exit = exitAnimRef.current;
            if (exit) {
                exitProgressRef.current = tickAnimation(exit);
                needsRender = true;
                if (exit.done) {
                    exitAnimRef.current = null;
                    hiddenRef.current = true;
                    onDismissRef.current?.();
                    if (animTimerRef.current) {
                        clearInterval(animTimerRef.current);
                        animTimerRef.current = null;
                    }
                }
            }
            if (needsRender)
                requestRender();
        }, 16);
    }
    const prevMessageRef = useRef(message);
    if (prevMessageRef.current !== message) {
        prevMessageRef.current = message;
        hiddenRef.current = false;
        exitAnimRef.current = null;
        exitProgressRef.current = 0;
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        startedRef.current = false;
        // Restart entrance animation for new message
        if (animated) {
            entranceStartedRef.current = false;
        }
    }
    // Start auto-hide timer eagerly if durationMs > 0
    if (durationMs > 0 && !startedRef.current && !hiddenRef.current) {
        startedRef.current = true;
        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            if (animated) {
                // Start exit animation (dim then disappear)
                exitAnimRef.current = createAnimation(0, 1, personality.animation.durationFast);
                exitProgressRef.current = 0;
                if (!animTimerRef.current) {
                    animTimerRef.current = setInterval(() => {
                        const exit = exitAnimRef.current;
                        if (exit) {
                            exitProgressRef.current = tickAnimation(exit);
                            if (exit.done) {
                                exitAnimRef.current = null;
                                hiddenRef.current = true;
                                onDismissRef.current?.();
                                if (animTimerRef.current) {
                                    clearInterval(animTimerRef.current);
                                    animTimerRef.current = null;
                                }
                            }
                            requestRender();
                        }
                    }, 16);
                }
            }
            else {
                hiddenRef.current = true;
                onDismissRef.current?.();
                requestRender();
            }
        }, durationMs);
    }
    useCleanup(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (animTimerRef.current) {
            clearInterval(animTimerRef.current);
            animTimerRef.current = null;
        }
    });
    if (!visibleProp || hiddenRef.current) {
        return null;
    }
    const colors = useColors();
    const typeColors = getTypeColors(colors);
    const color = typeColors[type] ?? colors.info;
    const icon = TYPE_ICONS[type] ?? "\u25C6";
    const userStyles = pickStyleProps(props);
    const boxProps = mergeBoxStyles({ role: "status", flexDirection: "row" }, userStyles);
    const isEntering = animated && entranceAnimRef.current !== null && !entranceAnimRef.current.done;
    const isExiting = animated && exitAnimRef.current !== null && !exitAnimRef.current.done;
    const content = props.renderContent
        ? React.createElement("tui-box", boxProps, props.renderContent(message, type, icon))
        : React.createElement("tui-box", boxProps, React.createElement("tui-text", { color, bold: true }, icon + " "), React.createElement("tui-text", { color }, message));
    // During entrance: show dimmed, then brighten
    if (isEntering && entranceProgressRef.current < 0.5) {
        return React.createElement("tui-box", { dim: true }, content);
    }
    // During exit: dim content as it fades out
    if (isExiting) {
        return React.createElement("tui-box", { dim: true }, content);
    }
    return content;
});
export const ToastContainer = React.memo(function ToastContainer(props) {
    const { toasts, position = "bottom", maxVisible = 3, onDismiss, } = props;
    const userStyles = pickStyleProps(props);
    if (toasts.length === 0) {
        return null;
    }
    // Take only the last maxVisible toasts (newest at end)
    const visibleToasts = toasts.slice(-maxVisible);
    const toastElements = visibleToasts.map((item) => React.createElement(Toast, {
        key: item.id,
        message: item.message,
        ...(item.type !== undefined ? { type: item.type } : {}),
        ...(item.durationMs !== undefined ? { durationMs: item.durationMs } : {}),
        visible: true,
        ...(onDismiss ? { onDismiss: () => onDismiss(item.id) } : {}),
    }));
    // Reverse order for "top" position so newest still appears closest to content
    const orderedElements = position === "top" ? [...toastElements].reverse() : toastElements;
    const boxProps = mergeBoxStyles({ flexDirection: "column" }, userStyles);
    return React.createElement("tui-box", boxProps, ...orderedElements);
});
export const Toast = Object.assign(ToastBase, {
    Provider: ToastProvider,
    Item: ToastCompoundItem,
});
//# sourceMappingURL=Toast.js.map