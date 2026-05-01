import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { dispatchScenarios } from "../../workers/dispatch.js";
describe("dispatchScenarios (child-process isolation)", () => {
    it("runs N scenarios in child processes and returns N results", async () => {
        const fixture = resolve(__dirname, "../fixtures/hello-app.tsx");
        const scenarios = Array.from({ length: 3 }, (_, i) => ({
            entry: fixture,
            scenario: { version: 1, name: `s${i}`, steps: [{ kind: "press", keys: ["tab"] }] },
        }));
        const results = await dispatchScenarios(scenarios, { jobs: 2 });
        expect(results).toHaveLength(3);
        expect(results.every((r) => r.status === "pass")).toBe(true);
    }, 60_000);
});
//# sourceMappingURL=jobs-isolation.integration.test.js.map