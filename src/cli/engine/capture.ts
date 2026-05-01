import type { RenderResult } from "../../testing/index.js";
import { renderToSvg } from "../../testing/svg-renderer.js";

export type CaptureFmt = "text" | "svg" | "json" | "ndjson";

export async function captureFinal(
  r: RenderResult,
  opts: { as: CaptureFmt },
): Promise<string> {
  switch (opts.as) {
    case "text":
      return r.output;
    case "svg":
      return renderToSvg(r.lines, r.styledOutput, r.width, r.height);
    case "json":
      return JSON.stringify({ finalText: r.output, lines: r.lines, durationMs: 0 });
    case "ndjson":
      throw new Error("ndjson is for frame streams; use captureFrames");
  }
}
