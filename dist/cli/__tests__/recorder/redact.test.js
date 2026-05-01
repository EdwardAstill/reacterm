import { describe, it, expect } from "vitest";
import { applyRedact } from "../../recorder/redact.js";
describe("applyRedact", () => {
    it("scrubs matched substrings", () => {
        expect(applyRedact("password123 keepme", /password\d+/)).toBe("[REDACTED] keepme");
    });
    it("noop without pattern", () => {
        expect(applyRedact("hi", undefined)).toBe("hi");
    });
});
//# sourceMappingURL=redact.test.js.map