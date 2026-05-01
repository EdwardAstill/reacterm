import { describe, it, expect } from "vitest";
import { normalizeScenario } from "../../schema/normalize.js";
describe("normalizeScenario", () => {
    it("expands press array into N press steps", () => {
        const s = normalizeScenario({ version: 1, name: "x", steps: [{ press: ["tab", "tab", "enter"] }] }, "x.yaml");
        expect(s.steps).toEqual([
            { kind: "press", keys: ["tab"] },
            { kind: "press", keys: ["tab"] },
            { kind: "press", keys: ["enter"] },
        ]);
    });
    it("converts waitFor string-form to object form", () => {
        const s = normalizeScenario({ version: 1, name: "x", steps: [{ waitFor: "ok" }] }, "x.yaml");
        expect(s.steps[0]).toEqual({ kind: "waitFor", text: "ok" });
    });
    it("parses timeout strings to ms", () => {
        const s = normalizeScenario({ version: 1, name: "x", timeout: "5s", steps: [{ sleep: "100ms" }] }, "x.yaml");
        expect(s.timeoutMs).toBe(5000);
        expect(s.steps[0]).toEqual({ kind: "sleep", ms: 100 });
    });
    it("preserves scroll target", () => {
        const s = normalizeScenario({ version: 1, name: "x", steps: [{ scroll: { direction: "down", target: { x: 5, y: 5 } } }] }, "x.yaml");
        expect(s.steps[0]).toEqual({ kind: "scroll", direction: "down", target: { x: 5, y: 5 } });
    });
});
//# sourceMappingURL=normalize.test.js.map