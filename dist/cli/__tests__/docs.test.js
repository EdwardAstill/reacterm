import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
describe("CLI docs", () => {
    it.each(["docs/cli.md", "docs/cli-output.md", "docs/scenarios.md"])("%s exists and mentions reacterm", (p) => {
        const path = resolve(__dirname, "../../../", p);
        expect(existsSync(path)).toBe(true);
        expect(readFileSync(path, "utf8")).toMatch(/reacterm/i);
    });
});
//# sourceMappingURL=docs.test.js.map