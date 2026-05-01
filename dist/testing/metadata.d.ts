import type { RenderContext } from "../core/render-context.js";
import type { TuiRoot } from "../reconciler/types.js";
export interface TestBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface TestFrame {
    index: number;
    output: string;
    styledOutput: string;
    screenHash: string;
    width: number;
    height: number;
}
export interface TestSemanticNode {
    id: string;
    type: string;
    role?: string;
    label?: string;
    testId?: string;
    text: string;
    focusId?: string;
    bounds: TestBounds;
    props: Record<string, unknown>;
}
export interface TestFocusableEntry {
    id: string;
    type: "input" | "scroll";
    bounds: TestBounds;
    disabled?: boolean;
    tabIndex?: number;
    groupId?: string;
}
export interface TestMetadata {
    frames: TestFrame[];
    semanticNodes: TestSemanticNode[];
    focusableEntries: TestFocusableEntry[];
    focusedId: string | null;
    warnings: string[];
    errors: string[];
    screenHash: string;
}
export declare function screenHash(output: string): string;
export declare function createFrame(index: number, output: string, styledOutput: string, width: number, height: number): TestFrame;
export declare function collectTestMetadata(options: {
    root: TuiRoot;
    renderContext: RenderContext;
    frames: TestFrame[];
    warnings: string[];
    errors: string[];
    screenHash: string;
}): TestMetadata;
//# sourceMappingURL=metadata.d.ts.map