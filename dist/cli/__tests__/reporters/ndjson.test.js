import { describe, it, expect } from "vitest";
import { ndjsonReporter } from "../../reporters/ndjson.js";
describe("ndjsonReporter", () => {
    it("emits one JSON object per line", () => {
        const out = ndjsonReporter([
            { status: "pass", finalText: "", durationMs: 10, name: "a" },
        ]);
        const lines = out.trim().split("\n");
        expect(lines.length).toBeGreaterThanOrEqual(2);
        for (const l of lines)
            JSON.parse(l);
        expect(JSON.parse(lines[0]).type).toBe("start");
        expect(JSON.parse(lines.at(-1)).type).toBe("summary");
    });
});
//# sourceMappingURL=ndjson.test.js.map