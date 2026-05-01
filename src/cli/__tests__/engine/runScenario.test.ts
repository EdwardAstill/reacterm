import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { runScenarioFromCli } from "../../engine/runScenario.js";

describe("runScenarioFromCli", () => {
  it("runs press sequence and returns finalText", async () => {
    const r = await runScenarioFromCli({
      entry: resolve(__dirname, "../fixtures/hello-app.tsx"),
      scenario: { version: 1, name: "smoke", steps: [{ kind: "press", keys: ["tab"] }] },
    });
    expect(r.status).toBe("pass");
    expect(r.finalText).toContain("Hello");
  });

  it("waitFor times out and reports failure", async () => {
    const r = await runScenarioFromCli({
      entry: resolve(__dirname, "../fixtures/hello-app.tsx"),
      scenario: { version: 1, name: "x", steps: [{ kind: "waitFor", text: "never", timeoutMs: 100 }] },
    });
    expect(r.status).toBe("fail");
    expect(r.failure).toMatch(/waitFor/);
  });
});
