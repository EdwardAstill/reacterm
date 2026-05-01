import { describe, it, expect } from "vitest";
import { CliError, formatError } from "../errors.js";
describe("CliError", () => {
    it("formats with hint", () => {
        const e = new CliError("could not load entry `src/App.tsx`: no such file", { hint: "relative paths resolve from cwd" });
        expect(formatError(e)).toBe("error: could not load entry `src/App.tsx`: no such file\nhint: relative paths resolve from cwd");
    });
    it("formats without hint", () => {
        const e = new CliError("bad");
        expect(formatError(e)).toBe("error: bad");
    });
});
//# sourceMappingURL=errors.test.js.map