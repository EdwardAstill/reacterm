import { describe, it, expect } from "vitest";
import { tapReporter } from "../../reporters/tap.js";
describe("tapReporter", () => {
    it("emits TAP 13 with ok/not ok lines", () => {
        const out = tapReporter([
            { status: "pass", finalText: "", durationMs: 10, name: "a" },
            { status: "fail", failure: "x", finalText: "", durationMs: 20, name: "b" },
        ]);
        expect(out).toMatch(/^TAP version 13/);
        expect(out).toMatch(/1\.\.2/);
        expect(out).toMatch(/ok 1 - a/);
        expect(out).toMatch(/not ok 2 - b/);
    });
});
//# sourceMappingURL=tap.test.js.map