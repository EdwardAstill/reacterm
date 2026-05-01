import { renderToSvg } from "../../testing/svg-renderer.js";
export async function captureFinal(r, opts) {
    switch (opts.as) {
        case "text":
            return r.output;
        case "svg": {
            const src = r;
            return renderToSvg(src.lines, src.styledOutput, src.width ?? 80, src.height ?? 24);
        }
        case "json":
            return JSON.stringify({ finalText: r.output, lines: r.lines, durationMs: 0 });
        case "ndjson":
            throw new Error("ndjson is for frame streams; use captureFrames");
    }
}
//# sourceMappingURL=capture.js.map