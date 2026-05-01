import { describe, expect, it } from "vitest";
import { runPtySmoke } from "../testing/index.js";

describe("runPtySmoke", () => {
  it("runs a command through node-pty when available and skips explicitly otherwise", async () => {
    const result = await runPtySmoke({
      command: process.execPath,
      args: ["-e", "console.log('pty-ready')"],
      timeoutMs: 2000,
    });

    if (result.skipped) {
      expect(result.reason).toContain("node-pty");
    } else {
      expect(result.output).toContain("pty-ready");
      expect(result.exitCode).toBe(0);
    }
  });
});
