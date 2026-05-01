import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { runDrive } from "../../verbs/drive.js";
import { Writable } from "node:stream";

const collect = () => {
  let s = "";
  const stream: any = new Writable({ write(c, _e, cb) { s += c.toString(); cb(); } });
  Object.defineProperty(stream, "text", { get: () => s });
  return stream as Writable & { text: string };
};

describe("drive verb", () => {
  it("runs an inline-flag script and writes capture to stdout", async () => {
    const stdout = collect(), stderr = collect();
    const code = await runDrive({
      entry: resolve(__dirname, "../fixtures/hello-app.tsx"),
      inline: [{ kind: "press", keys: ["tab"] }],
      capture: "text", stdout, stderr,
    });
    expect(code).toBe(0);
    expect(stdout.text).toContain("Hello");
  });

  it("returns exit 1 on waitFor timeout", async () => {
    const stdout = collect(), stderr = collect();
    const code = await runDrive({
      entry: resolve(__dirname, "../fixtures/hello-app.tsx"),
      inline: [{ kind: "waitFor", text: "never", timeoutMs: 100 }],
      capture: "text", stdout, stderr,
    });
    expect(code).toBe(1);
  });
});
