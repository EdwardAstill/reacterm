import type { RenderResult } from "../../testing/index.js";
import { renderToSvg } from "../../testing/svg-renderer.js";

export type CaptureFmt = "text" | "svg" | "json" | "ndjson";

/** Accepts either RenderResult (from renderForTest) or TuiDriver (from renderDriver). */
export type CaptureSource = Pick<RenderResult, "output" | "lines"> & { metadata: any };

export async function captureFinal(
  r: CaptureSource,
  opts: { as: CaptureFmt },
): Promise<string> {
  switch (opts.as) {
    case "text":
      return r.output;
    case "svg": {
      const src = r as any;
      return renderToSvg(
        src.lines as string[],
        src.styledOutput as string,
        (src.width as number | undefined) ?? 80,
        (src.height as number | undefined) ?? 24,
      );
    }
    case "json":
      return JSON.stringify({ finalText: r.output, lines: r.lines, durationMs: 0 });
    case "ndjson":
      throw new Error("ndjson is for frame streams; use captureFrames");
  }
}
