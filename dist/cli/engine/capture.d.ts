import type { RenderResult } from "../../testing/index.js";
export type CaptureFmt = "text" | "svg" | "json" | "ndjson";
/** Accepts either RenderResult (from renderForTest) or TuiDriver (from renderDriver). */
export type CaptureSource = Pick<RenderResult, "output" | "lines"> & {
    metadata: any;
};
export declare function captureFinal(r: CaptureSource, opts: {
    as: CaptureFmt;
}): Promise<string>;
//# sourceMappingURL=capture.d.ts.map