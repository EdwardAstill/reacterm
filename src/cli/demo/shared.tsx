import React from "react";
import { useMouseTarget } from "./demo-kit.js";

export type ToastType = "info" | "success" | "warning" | "error";
export interface DemoToast { id: string; msg: string; type?: ToastType }
export type ToastFn = (msg: string, type?: ToastType) => void;

export interface ClickableProps {
  onClick: () => void;
  /** Optional middle-click handler. */
  onAlt?: () => void;
  children: React.ReactNode;
  /** Forwarded to the underlying tui-box for layout. */
  flexDirection?: "row" | "column";
  width?: number | string;
  height?: number;
  flex?: number;
  flexShrink?: number;
  flexGrow?: number;
  paddingX?: number;
  paddingY?: number;
  marginRight?: number;
  borderStyle?: "single" | "double" | "round" | "heavy" | "ascii" | "none";
  borderColor?: string | number;
}

export function Clickable(props: ClickableProps): React.ReactElement {
  const { onClick, onAlt, children, ...layout } = props;
  const target = useMouseTarget({
    onMouse: (event) => {
      if (event.action !== "press") return;
      if (event.button === "left") onClick();
      else if (event.button === "middle") onAlt?.();
    },
  });
  return React.createElement(
    "tui-box",
    { ...layout, ...target.targetProps },
    children,
  );
}

export function pushToast(
  setToasts: React.Dispatch<React.SetStateAction<DemoToast[]>>,
  msg: string,
  type: ToastType = "info",
): void {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  setToasts((prev) => [...prev, { id, msg, type }]);
}
