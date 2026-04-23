import type { MeasuredLayout } from "../reconciler/renderer.js";
export declare function getBoundingBox(elementId: string, measureMap: Map<string, MeasuredLayout>): {
    x: number;
    y: number;
    width: number;
    height: number;
} | null;
export declare function getWidth(elementId: string, measureMap: Map<string, MeasuredLayout>): number | null;
export declare function getHeight(elementId: string, measureMap: Map<string, MeasuredLayout>): number | null;
/** Find the smallest element containing the given screen coordinates. */
export declare function hitTest(x: number, y: number, measureMap: Map<string, MeasuredLayout>): {
    elementId: string;
    x: number;
    y: number;
} | null;
//# sourceMappingURL=measurement.d.ts.map