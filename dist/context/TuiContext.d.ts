/**
 * TuiContext — React context providing access to screen, input, and exit.
 */
import { type ReactNode } from "react";
import type { Screen } from "../core/screen.js";
import type { InputManager } from "../input/manager.js";
import type { FocusManager } from "../core/focus.js";
import type { RenderContext } from "../core/render-context.js";
export interface TuiContextValue {
    screen: Screen;
    input: InputManager;
    focus: FocusManager;
    exit: (error?: Error) => void;
    /** Force a paint cycle without going through React's scheduler. */
    requestRender: () => void;
    /** Run a callback with synchronous React flushing — state updates inside commit immediately. */
    flushSync: (fn: () => void) => void;
    /** Invalidate the diff cache and trigger a full repaint. */
    clear: () => void;
    /** The render context for this app instance — holds all per-instance state. */
    renderContext: RenderContext;
    /**
     * Write committed content above the live render area.
     * The text becomes part of terminal scrollback — scrollable, selectable, copyable.
     * The live section is erased, the text is written, and the live section is repainted below.
     */
    commitText: (text: string) => void;
}
export declare const TuiContext: import("react").Context<TuiContextValue | null>;
/** Access screen, input, focus, exit, requestRender, flushSync, and renderContext. */
export declare function useTui(): TuiContextValue;
export declare function TuiProvider({ value, children }: {
    value: TuiContextValue;
    children?: ReactNode;
}): import("react").FunctionComponentElement<import("react").ProviderProps<TuiContextValue | null>>;
//# sourceMappingURL=TuiContext.d.ts.map