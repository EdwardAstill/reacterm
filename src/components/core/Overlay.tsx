import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

const DEFAULT_FREE_TOP = 5;
const DEFAULT_FREE_LEFT = 10;
const DEFAULT_FREE_WIDTH = 40;
const DEFAULT_FREE_HEIGHT = 10;
import { useTui } from "../../context/TuiContext.js";
import { useMouse } from "../../hooks/useMouse.js";
import { useMouseTarget } from "../../hooks/useMouseTarget.js";
import { useInput } from "../../hooks/useInput.js";
import { INPUT_PRIORITY } from "../../input/priorities.js";
import type { KeyEvent, MouseEvent } from "../../input/types.js";
import type { BorderStyle } from "../../core/types.js";
import { useColors } from "../../hooks/useColors.js";

let nextOverlayId = 0;

export interface OverlayManagerValue {
  register(id: string): number;
  bringToFront(id: string): number;
}

const moduleZCounter = { current: 100 };
function moduleAssignZ(): number {
  return ++moduleZCounter.current;
}

export const OverlayContext = createContext<OverlayManagerValue | null>(null);

export function OverlayProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const counterRef = useRef(100);
  const known = useRef(new Map<string, number>());
  // Memoize so consumers don't re-render on every parent render — refs are stable for the lifetime of this component.
  const value = useMemo<OverlayManagerValue>(() => ({
    register(id) {
      const existing = known.current.get(id);
      if (existing !== undefined) return existing;
      const z = ++counterRef.current;
      known.current.set(id, z);
      return z;
    },
    bringToFront(id) {
      const z = ++counterRef.current;
      known.current.set(id, z);
      return z;
    },
  }), []);
  return React.createElement(OverlayContext.Provider, { value }, children);
}

export interface OverlayProps {
  children?: React.ReactNode;
  visible?: boolean;
  position?: "center" | "bottom" | "top" | "center-left" | "center-right" | "free";
  width?: number | `${number}%`;
  height?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  borderStyle?: BorderStyle;
  borderColor?: string | number;
  padding?: number;
  paddingX?: number;
  paddingY?: number;

  /** Optional title bar. When `movable`, dragging the title bar moves the overlay. */
  title?: string;
  /** Initial top coord (cells). Setting any default* coord forces free positioning. */
  defaultTop?: number;
  /** Initial left coord (cells). */
  defaultLeft?: number;
  /** Controlled top coord. */
  top?: number;
  /** Controlled left coord. */
  left?: number;
  /** Called when the user drags the overlay to a new position. */
  onMove?: (pos: { top: number; left: number }) => void;
  /** Initial width when uncontrolled and in free mode. */
  defaultWidth?: number;
  /** Initial height when uncontrolled and in free mode. */
  defaultHeight?: number;
  /** Called when the user resizes. */
  onResize?: (size: { width: number; height: number }) => void;
  /** When true, dragging the title bar moves the overlay. Default: false. */
  movable?: boolean;
  /** When true, dragging the bottom-right corner resizes. Default: false. */
  resizable?: boolean;
  /** Show the visual resize-handle glyph in the bottom-right corner.
   * Defaults to `true` when `resizable` is true. Set to `false` for a flush look —
   * resize still works (drag the bottom-right region), the glyph just isn't drawn. */
  showResizeHandle?: boolean;
  /** Glyph used for the resize handle. Default: `"+"`. Avoid East Asian Ambiguous-width
   * characters (e.g. `⇲`, `↘`, `◢`) — terminals like Kitty / WezTerm with EAA=wide will
   * render them as 2 cells, painting over the right border. Stick to ASCII or
   * Box-Drawing block (U+2500..U+25FF) for cross-terminal reliability. */
  resizeHandleGlyph?: string;
  /** Optional close handler. Surfaces "[Esc to close]" hint. */
  onClose?: () => void;
  /** Stable id for z-order management. Auto-generated if omitted. */
  id?: string;
  /** Min size when resizable. Default: { width: 10, height: 3 }. */
  minSize?: { width: number; height: number };
  /** Max size when resizable. Default: screen size. */
  maxSize?: { width: number; height: number };
}

interface DragState {
  startX: number;
  startY: number;
  startTop: number;
  startLeft: number;
}

interface ResizeState {
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

export const Overlay = React.memo(function Overlay(props: OverlayProps): React.ReactElement | null {
  const {
    children,
    visible = true,
    title,
    movable = false,
    resizable = false,
    showResizeHandle,
    resizeHandleGlyph = "+",
    onClose,
    onMove,
    onResize,
    minSize = { width: 10, height: 3 },
    maxSize,
    borderStyle = "single",
    borderColor,
    padding,
    paddingX,
    paddingY,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
  } = props;

  const colors = useColors();
  const { screen } = useTui();
  const idRef = useRef<string>(props.id ?? `overlay-${nextOverlayId++}`);

  const manager = useContext(OverlayContext);
  const [zIndex, setZIndex] = useState<number>(() =>
    manager ? manager.register(idRef.current) : moduleAssignZ(),
  );

  const isFreeMode =
    movable || resizable ||
    props.defaultTop !== undefined || props.defaultLeft !== undefined ||
    props.top !== undefined || props.left !== undefined ||
    props.position === "free";

  const [stateTop, setStateTop] = useState<number>(props.defaultTop ?? DEFAULT_FREE_TOP);
  const [stateLeft, setStateLeft] = useState<number>(props.defaultLeft ?? DEFAULT_FREE_LEFT);
  const currentTop = props.top ?? stateTop;
  const currentLeft = props.left ?? stateLeft;

  const [stateWidth, setStateWidth] = useState<number>(props.defaultWidth ?? DEFAULT_FREE_WIDTH);
  const [stateHeight, setStateHeight] = useState<number>(props.defaultHeight ?? DEFAULT_FREE_HEIGHT);
  const currentWidth: number | `${number}%` | undefined = isFreeMode
    ? (typeof props.width === "number" ? props.width : stateWidth)
    : props.width;
  const currentHeight: number | undefined = isFreeMode
    ? (typeof props.height === "number" ? props.height : stateHeight)
    : props.height;

  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const bringToFront = useCallback(() => {
    if (manager) {
      setZIndex(manager.bringToFront(idRef.current));
    } else {
      setZIndex(moduleAssignZ());
    }
  }, [manager]);

  // Register zones from broadest (lowest priority) to most-specific (highest priority).
  // The dispatcher checks zones in reverse-registration order, so the last-registered
  // zone wins for an overlapping click. bodyMouse must register FIRST so titleMouse and
  // resizeMouse take precedence inside their narrower regions.
  const bodyMouse = useMouseTarget({
    onMouse: (event: MouseEvent) => {
      if (event.action === "press") bringToFront();
    },
  });

  const titleMouse = useMouseTarget({
    disabled: !movable || !title,
    onMouse: (event: MouseEvent) => {
      if (event.button !== "left" || event.action !== "press") return;
      bringToFront();
      dragRef.current = {
        startX: event.x,
        startY: event.y,
        startTop: currentTop,
        startLeft: currentLeft,
      };
    },
  });

  // Close-X button. Registered AFTER titleMouse so its narrower zone wins for clicks
  // on the X glyph — those don't start a drag.
  const closeMouse = useMouseTarget({
    disabled: !onClose,
    onMouse: (event: MouseEvent) => {
      if (event.button !== "left" || event.action !== "press") return;
      onCloseRef.current?.();
    },
  });

  const resizeMouse = useMouseTarget({
    disabled: !resizable,
    onMouse: (event: MouseEvent) => {
      if (event.button !== "left" || event.action !== "press") return;
      bringToFront();
      const w = typeof currentWidth === "number" ? currentWidth : stateWidth;
      const h = typeof currentHeight === "number" ? currentHeight : stateHeight;
      resizeRef.current = {
        startX: event.x,
        startY: event.y,
        startWidth: w,
        startHeight: h,
      };
    },
  });

  useMouse((event: MouseEvent) => {
    if (dragRef.current) {
      const drag = dragRef.current;
      if (event.action === "move") {
        // Clamp internal state so the next drag-from-here starts from a sane position.
        // The renderer also clamps at paint time, but stale unclamped state would make
        // a subsequent drag jump from off-screen coords back into view.
        const w = typeof currentWidth === "number" ? currentWidth : stateWidth;
        const h = typeof currentHeight === "number" ? currentHeight : stateHeight;
        const rawLeft = drag.startLeft + (event.x - drag.startX);
        const rawTop = drag.startTop + (event.y - drag.startY);
        const newLeft = Math.max(0, Math.min(rawLeft, screen.width - w));
        const newTop = Math.max(0, Math.min(rawTop, screen.height - h));
        if (props.left === undefined) setStateLeft(newLeft);
        if (props.top === undefined) setStateTop(newTop);
        onMove?.({ top: newTop, left: newLeft });
      } else if (event.action === "release") {
        dragRef.current = null;
      }
    }
    if (resizeRef.current) {
      const rs = resizeRef.current;
      if (event.action === "move") {
        const dx = event.x - rs.startX;
        const dy = event.y - rs.startY;
        const maxW = maxSize?.width ?? screen.width;
        const maxH = maxSize?.height ?? screen.height;
        const newW = Math.max(minSize.width, Math.min(maxW, rs.startWidth + dx));
        const newH = Math.max(minSize.height, Math.min(maxH, rs.startHeight + dy));
        if (props.width === undefined) setStateWidth(newW);
        if (props.height === undefined) setStateHeight(newH);
        onResize?.({ width: newW, height: newH });
      } else if (event.action === "release") {
        resizeRef.current = null;
      }
    }
  });

  useInput(
    useCallback((event: KeyEvent) => {
      if (event.key === "escape") {
        event.consumed = true;
        onCloseRef.current?.();
      }
    }, []),
    { isActive: visible && !!onClose, priority: INPUT_PRIORITY.MODAL },
  );

  if (!visible) return null;

  const overlayProps: Record<string, unknown> = {
    visible: true,
    zIndex,
    borderStyle,
  };
  if (borderColor !== undefined) overlayProps["borderColor"] = borderColor;
  if (padding !== undefined) overlayProps["padding"] = padding;
  if (paddingX !== undefined) overlayProps["paddingX"] = paddingX;
  if (paddingY !== undefined) overlayProps["paddingY"] = paddingY;
  if (minWidth !== undefined) overlayProps["minWidth"] = minWidth;
  if (maxWidth !== undefined) overlayProps["maxWidth"] = maxWidth;
  if (minHeight !== undefined) overlayProps["minHeight"] = minHeight;
  if (maxHeight !== undefined) overlayProps["maxHeight"] = maxHeight;

  if (isFreeMode) {
    overlayProps["position"] = "free";
    overlayProps["top"] = currentTop;
    overlayProps["left"] = currentLeft;
    if (currentWidth !== undefined) overlayProps["width"] = currentWidth;
    if (currentHeight !== undefined) overlayProps["height"] = currentHeight;
  } else {
    if (props.position !== undefined) overlayProps["position"] = props.position;
    if (props.width !== undefined) overlayProps["width"] = props.width;
    if (props.height !== undefined) overlayProps["height"] = props.height;
  }

  const contentChildren: React.ReactElement[] = [];

  if (title) {
    // Span the full inner width so the entire title row is a drag handle, not just the
    // characters of the title text. Without width:100%, the row auto-sizes to the text and
    // dragging only works while the cursor is over the literal title characters.
    const titleChildren: (React.ReactElement | null)[] = [
      React.createElement(
        "tui-text",
        { key: "title-text", bold: true, color: colors.text.primary },
        title,
      ),
      React.createElement("tui-box", { key: "title-spacer", flexGrow: 1 }),
    ];
    if (onClose) {
      // The close button is a narrow zone over the X glyph. Registration order puts it AFTER
      // titleMouse, so clicks on the X dispatch here (not to the drag handler).
      // Wrap the text in a tui-box because focus zones are bound to box/scroll-view
      // elements, not text — the renderer only reads `_focusId` in those painters.
      titleChildren.push(
        React.createElement(
          "tui-box",
          {
            key: "close-x",
            flexShrink: 0,
            ...closeMouse.targetProps,
          },
          React.createElement(
            "tui-text",
            { color: colors.text.dim },
            "[×]",
          ),
        ),
      );
    }
    contentChildren.push(
      React.createElement(
        "tui-box",
        {
          key: "title",
          flexDirection: "row",
          width: "100%",
          flexShrink: 0,
          ...titleMouse.targetProps,
        },
        ...titleChildren,
      ),
    );
  }

  // Body must clip — without `overflow: "hidden"`, content that exceeds the body's
  // flex-allotted height paints over the resize row and the bottom border. This is the
  // most common cause of "the ⇲ glyph isn't in the corner" — the glyph IS in the corner,
  // but the body's overflowing text is repainting over it.
  contentChildren.push(
    React.createElement(
      "tui-box",
      { key: "body", flexDirection: "column", flex: 1, overflow: "hidden" },
      children,
    ),
  );

  // Resize handle is always rendered last so it pins to the bottom interior row.
  // The `[×]` button in the title bar replaces the textual `[Esc to close]` hint when
  // onClose is set — Esc still works, the X button is the visible affordance.
  if (resizable) {
    const drawHandle = showResizeHandle ?? true;
    // Right-align the glyph by pairing a flex-grow spacer with the handle text. justifyContent:
    // flex-end on a tui-box with a single text child does not actually push the child to the end,
    // so we use the spacer pattern instead.
    contentChildren.push(
      React.createElement(
        "tui-box",
        {
          key: "resize",
          flexDirection: "row",
          width: "100%",
          height: 1,
          flexShrink: 0,
          ...resizeMouse.targetProps,
        },
        React.createElement("tui-box", { flexGrow: 1 }),
        drawHandle
          ? React.createElement("tui-text", { color: colors.text.dim }, resizeHandleGlyph)
          : null,
      ),
    );
  }

  return React.createElement(
    "tui-overlay",
    overlayProps,
    React.createElement(
      "tui-box",
      {
        flexDirection: "column",
        // Stretch to fill the overlay's interior — without this the wrapper auto-sizes to
        // content height, which collapses `flex: 1` on the inner body box and leaves the
        // resize-handle row floating above empty cells instead of pinned to the bottom.
        width: "100%",
        height: "100%",
        ...bodyMouse.targetProps,
      },
      ...contentChildren,
    ),
  );
});
