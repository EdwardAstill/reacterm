import React from "react";
import Reconciler from "react-reconciler";
import { TestInputManager } from "../testing/input-manager.js";
import { type TestMetadata } from "../testing/metadata.js";
export declare const TuiReconciler: ReturnType<typeof Reconciler>;
export declare function syncContainerUpdate(element: React.ReactElement, container: ReturnType<typeof TuiReconciler.createContainer>): void;
export interface RenderToStringOptions {
    /** Terminal width in columns (default: 80). */
    width?: number;
    /** Terminal height in rows (default: 24). */
    height?: number;
    /** Alias for width. */
    columns?: number;
    /** Alias for height. */
    rows?: number;
}
export interface RenderToStringResult {
    /** Plain text output with ANSI escape codes stripped. */
    output: string;
    /** Output with ANSI escape codes for styled rendering. */
    styledOutput: string;
    /** Plain text split into individual lines. */
    lines: string[];
    /** Unmount the React tree and clean up. */
    unmount: () => void;
    /** Re-render with a new element and return updated result. */
    rerender: (element: React.ReactElement) => RenderToStringResult;
    /** Mock input manager for simulating key/mouse events */
    input: TestInputManager;
    /** Test metadata for semantic queries, frame history, focus, and diagnostics. */
    metadata: TestMetadata;
}
/** Synchronous. No terminal needed. Same reconciler + layout as render(), but paints to a string buffer. */
export declare function renderToString(element: React.ReactElement, options?: RenderToStringOptions): RenderToStringResult;
//# sourceMappingURL=render-to-string.d.ts.map