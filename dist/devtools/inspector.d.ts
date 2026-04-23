/**
 * Inspector middleware — overlays component information on the rendered buffer.
 *
 * When enabled, draws colored borders around each component's layout box,
 * labels elements with their type names, and shows a detail panel for the
 * selected element. Designed for use during development.
 */
import type { RenderMiddleware } from "../core/middleware.js";
import type { TuiElement, TuiRoot } from "../reconciler/types.js";
export interface InspectorState {
    enabled: boolean;
    selectedElement: TuiElement | null;
    showLayoutBoxes: boolean;
    showComponentNames: boolean;
}
/**
 * Creates an inspector middleware that overlays component debug info.
 *
 * The middleware post-processes the ScreenBuffer after normal painting,
 * drawing colored borders and labels on top of the rendered content.
 *
 * Call `setRoot(root)` each frame (or once) to provide the element tree
 * for traversal. Without a root, the overlay has nothing to inspect.
 */
export declare function createInspectorMiddleware(): {
    middleware: RenderMiddleware;
    toggle: () => void;
    selectNext: () => void;
    selectPrev: () => void;
    getState: () => InspectorState;
    setRoot: (root: TuiRoot) => void;
};
//# sourceMappingURL=inspector.d.ts.map