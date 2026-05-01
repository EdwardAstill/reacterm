import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { runDemo, DEMO_PATH } from "../../verbs/demo.js";

describe("demo verb", () => {
  it("DEMO_PATH points to examples/reacterm-demo.tsx and that file exists", () => {
    expect(DEMO_PATH).toMatch(/examples\/reacterm-demo\.tsx$/);
    expect(existsSync(DEMO_PATH)).toBe(true);
  });

  it("runDemo returns a numeric exit code", async () => {
    const code = await runDemo();
    expect(code).toBeTypeOf("number");
  }, 30_000);
});
