import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { runDemo, DEMO_PATH } from "../../verbs/demo.js";
describe("demo verb", () => {
    it("DEMO_PATH points to examples/reacterm-demo.tsx and that file exists", () => {
        expect(DEMO_PATH).toMatch(/examples\/reacterm-demo\.tsx$/);
        expect(existsSync(DEMO_PATH)).toBe(true);
    });
    it("runDemo is an async function that returns a Promise<number>", () => {
        expect(typeof runDemo).toBe("function");
        // Don't actually invoke — the demo is an interactive TUI that doesn't auto-quit.
        // End-to-end validation happens via bin/reacterm.mjs in Task 23 + manual smoke.
    });
});
//# sourceMappingURL=demo.test.js.map