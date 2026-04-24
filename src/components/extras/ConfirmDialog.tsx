import React, { useRef, useCallback, createContext, useContext } from "react";
import { useInput } from "../../hooks/useInput.js";
import { useCleanup } from "../../hooks/useCleanup.js";
import { useTui } from "../../context/TuiContext.js";
import { FocusGroup } from "../core/FocusGroup.js";
import { useColors } from "../../hooks/useColors.js";
import type { KeyEvent } from "../../input/types.js";
import type { StormContainerStyleProps } from "../../styles/styleProps.js";
import { mergeBoxStyles, pickStyleProps } from "../../styles/applyStyles.js";
import { usePersonality } from "../../core/personality.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { getDialogTypeColors, getDialogVariantColors } from "../../utils/theme-maps.js";
import { INPUT_PRIORITY } from "../../input/priorities.js";

/**
 * Runs a 1-second-tick countdown while `active` is true. Side effects use the
 * reacterm render-phase pattern (eager init + useCleanup on unmount); useEffect
 * cleanup is unreliable in Storm's reconciler. Returns remaining whole seconds,
 * or null when inactive.
 */
function useCountdown(active: boolean, durationMs: number | undefined, onExpire: () => void): number | null {
  const { requestRender } = useTui();
  const remainingRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  if (active && durationMs != null && durationMs > 0 && !startedRef.current) {
    startedRef.current = true;
    remainingRef.current = Math.ceil(durationMs / 1000);
    timerRef.current = setInterval(() => {
      if (remainingRef.current != null && remainingRef.current > 1) {
        remainingRef.current -= 1;
        requestRender();
      } else {
        if (timerRef.current != null) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        remainingRef.current = null;
        onExpireRef.current();
      }
    }, 1000);
  } else if (!active && startedRef.current) {
    startedRef.current = false;
    remainingRef.current = null;
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  useCleanup(() => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  });

  return remainingRef.current;
}

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

export const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export function useConfirmDialogContext(): ConfirmDialogContextValue {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) throw new Error("ConfirmDialog sub-components must be used inside ConfirmDialog.Root");
  return ctx;
}

export interface ConfirmDialogRootProps {
  visible: boolean;
  type?: "info" | "warning" | "danger";
  onConfirm?: () => void;
  onCancel?: () => void;
  focusedActionIndex?: number;
  onFocusedActionChange?: (index: number) => void;
  children: React.ReactNode;
}

function ConfirmDialogRoot({
  visible,
  type = "info",
  onConfirm,
  onCancel,
  focusedActionIndex = 0,
  onFocusedActionChange,
  children,
}: ConfirmDialogRootProps): React.ReactElement | null {
  const { requestRender } = useTui();
  const personality = usePersonality();
  const colors = useColors();
  const onFocusRef = useRef(onFocusedActionChange);
  onFocusRef.current = onFocusedActionChange;

  if (!visible) return null;

  const borderColor = ({ info: colors.brand.primary, warning: colors.warning, danger: colors.error } as Record<string, string>)[type] ?? colors.brand.primary;

  const ctx: ConfirmDialogContextValue = {
    visible,
    type,
    onConfirm,
    onCancel,
    focusedActionIndex,
    setFocusedActionIndex: (i: number) => { onFocusRef.current?.(i); requestRender(); },
  };

  return React.createElement(
    ConfirmDialogContext.Provider,
    { value: ctx },
    React.createElement(
      "tui-overlay",
      { position: "center", borderStyle: personality.borders.accent, borderColor, paddingX: 2, paddingY: 1 },
      React.createElement("tui-box", { flexDirection: "column" }, children),
    ),
  );
}

export interface ConfirmDialogCompoundMessageProps {
  children: React.ReactNode;
}

function ConfirmDialogCompoundMessage({ children }: ConfirmDialogCompoundMessageProps): React.ReactElement {
  return React.createElement("tui-box", { flexDirection: "column" }, children);
}

export interface ConfirmDialogCompoundActionsProps {
  children: React.ReactNode;
}

function ConfirmDialogCompoundActions({ children }: ConfirmDialogCompoundActionsProps): React.ReactElement {
  return React.createElement(
    "tui-box",
    { flexDirection: "row" },
    children,
  );
}

const ConfirmDialogBase = React.memo(function ConfirmDialog(rawProps: ConfirmDialogProps): React.ReactElement | null {
  const colors = useColors();
  const props = usePluginProps("ConfirmDialog", rawProps);
  const personality = usePersonality();
  const {
    visible,
    message,
    onConfirm,
    onCancel,
    confirmLabel = "Yes",
    cancelLabel = "No",
    type = "info",
    timeoutMs,
    timeoutAction = "cancel",
    actions,
  } = props;

  const { requestRender } = useTui();

  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  // Focused action button index (for multi-action mode)
  const focusedActionRef = useRef(0);

  const timeoutActionRef = useRef(timeoutAction);
  timeoutActionRef.current = timeoutAction;
  const handleExpire = useCallback(() => {
    if (timeoutActionRef.current === "confirm") onConfirmRef.current?.();
    else onCancelRef.current?.();
  }, []);
  const remainingSec = useCountdown(visible, timeoutMs, handleExpire);

  if (!visible) {
    focusedActionRef.current = 0;
  }

  const typeRef = useRef(type);
  typeRef.current = type;

  const handleInput = useCallback((event: KeyEvent) => {
    if (!visibleRef.current) return;

    const acts = actionsRef.current;

    // Multi-action mode
    if (acts && acts.length > 0) {
      if (event.key === "tab") {
        if (event.shift) {
          focusedActionRef.current =
            focusedActionRef.current > 0 ? focusedActionRef.current - 1 : acts.length - 1;
        } else {
          focusedActionRef.current =
            focusedActionRef.current < acts.length - 1 ? focusedActionRef.current + 1 : 0;
        }
        requestRender();
        return;
      }
      if (event.key === "return") {
        const action = acts[focusedActionRef.current];
        if (action) {
          action.action();
        }
        return;
      }
      if (event.key === "escape") {
        onCancelRef.current?.();
        return;
      }
      if (event.char) {
        for (const action of acts) {
          if (action.key.toLowerCase() === event.char.toLowerCase()) {
            action.action();
            return;
          }
        }
      }
      return;
    }

    // Standard confirm/cancel mode
    if (event.char === "y" || event.char === "Y") {
      onConfirmRef.current?.();
    } else if (event.key === "return") {
      // For danger dialogs, Enter should NOT auto-confirm to prevent
      // accidental confirmation of destructive actions. Only explicit
      // Y/N keys should work for danger dialogs.
      if (typeRef.current !== "danger") {
        onConfirmRef.current?.();
      }
    } else if (event.key === "escape" || event.char === "n" || event.char === "N") {
      onCancelRef.current?.();
    }
  }, [requestRender]);

  // Focus trap: use priority input when visible to suppress all other handlers.
  // Priority exceeds INPUT_PRIORITY.MODAL so a ConfirmDialog mounted over a
  // Modal receives Escape (otherwise the Modal's higher priority would steal
  // the event and close the wrong layer).
  useInput(handleInput, {
    isActive: visible,
    ...(visible ? { priority: INPUT_PRIORITY.CONFIRM_DIALOG } : {}),
  });

  if (!visible) return null;

  const userStyles = pickStyleProps(props);
  const typeColors = getDialogTypeColors(colors);
  const variantColors = getDialogVariantColors(colors);
  const borderColor = typeColors[type] ?? colors.brand.primary;

  const children: React.ReactElement[] = [];

  // Message text
  children.push(
    React.createElement(
      "tui-text",
      { key: "msg", color: colors.text.primary },
      message,
    ),
  );

  // Countdown indicator
  if (remainingSec != null) {
    const actionLabel = timeoutAction === "confirm" ? "auto-confirm" : "auto-cancel";
    children.push(
      React.createElement(
        "tui-text",
        { key: "countdown", color: colors.text.dim, dim: true },
        `(${actionLabel} in ${remainingSec}s)`,
      ),
    );
  }

  // Spacer line
  children.push(
    React.createElement("tui-text", { key: "spacer" }, ""),
  );

  // Button row
  if (actions && actions.length > 0) {
    // Multi-action buttons
    const buttonElements: React.ReactElement[] = [];
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i]!;
      const isFocusedAction = i === focusedActionRef.current;
      const variantColor = variantColors[action.variant ?? "default"] ?? colors.text.secondary;

      if (i > 0) {
        buttonElements.push(
          React.createElement("tui-text", { key: `sep-${i}` }, "  "),
        );
      }

      buttonElements.push(
        React.createElement(
          "tui-text",
          {
            key: action.key,
            color: isFocusedAction ? variantColor : colors.text.dim,
            bold: isFocusedAction,
            inverse: isFocusedAction,
          },
          `[${action.label}]`,
        ),
      );
    }

    children.push(
      React.createElement(
        "tui-box",
        { key: "buttons", flexDirection: "row" },
        ...buttonElements,
      ),
    );
  } else {
    // Standard confirm/cancel buttons
    children.push(
      React.createElement(
        "tui-box",
        { key: "buttons", flexDirection: "row" },
        React.createElement(
          "tui-text",
          { key: "confirm", color: colors.success, bold: true },
          `[${confirmLabel}]`,
        ),
        React.createElement("tui-text", { key: "sep" }, "  "),
        React.createElement(
          "tui-text",
          { key: "cancel", color: colors.text.secondary },
          `[${cancelLabel}]`,
        ),
      ),
    );
  }

  const overlayProps = mergeBoxStyles(
    {
      position: "center",
      borderStyle: personality.borders.accent,
      borderColor,
      paddingX: 2,
      paddingY: 1,
    },
    userStyles,
  );

  return React.createElement(
    "tui-overlay",
    overlayProps,
    React.createElement(
      FocusGroup,
      { trap: true, direction: "horizontal" },
      ...children,
    ),
  );
});

export const ConfirmDialog = Object.assign(ConfirmDialogBase, {
  Root: ConfirmDialogRoot,
  Message: ConfirmDialogCompoundMessage,
  Actions: ConfirmDialogCompoundActions,
});
