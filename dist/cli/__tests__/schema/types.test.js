import { describe, it, expectTypeOf } from "vitest";
describe("scenario types", () => {
    it("Scenario allows entry omission (CLI-supplied)", () => {
        const s = { version: 1, name: "x", steps: [] };
        expectTypeOf(s.entry).toEqualTypeOf();
    });
    it("Step is a discriminated union covering all spec verbs", () => {
        const steps = [
            { kind: "press", keys: ["tab"] },
            { kind: "type", text: "x" },
            { kind: "paste", text: "x" },
            { kind: "click", x: 1, y: 1 },
            { kind: "scroll", direction: "up" },
            { kind: "resize", cols: 80, rows: 24 },
            { kind: "waitFor", text: "ok", timeoutMs: 2000 },
            { kind: "sleep", ms: 100 },
            { kind: "snapshot", as: "svg", path: "x.svg" },
        ];
        expectTypeOf(steps).toEqualTypeOf();
    });
    it("Expectation covers spec contract types", () => {
        const e = [
            { kind: "contains", text: "x" },
            { kind: "line", at: 0, equals: "x" },
            { kind: "expectSnapshot", path: "x.svg" },
            { kind: "exitCode", code: 0 },
            { kind: "noWarnings" },
            { kind: "frameCount", min: 1 },
        ];
        expectTypeOf(e).toEqualTypeOf();
    });
});
//# sourceMappingURL=types.test.js.map