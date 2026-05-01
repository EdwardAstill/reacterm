import { describe, it, expect, vi } from "vitest";
import { installSignalHandlers } from "../../signals/handler.js";
describe("installSignalHandlers", () => {
    it("calls onTeardown once on first signal", () => {
        const onTeardown = vi.fn();
        const onExit = vi.fn();
        const h = installSignalHandlers({ onTeardown, onExit });
        h.simulate("SIGINT");
        expect(onTeardown).toHaveBeenCalledTimes(1);
        expect(onExit).toHaveBeenCalledWith(130);
        h.dispose();
    });
    it("escalates to SIGKILL on second SIGINT within 2s", () => {
        const onForceKill = vi.fn();
        const onExit = vi.fn();
        const h = installSignalHandlers({ onTeardown: () => { }, onExit, onForceKill });
        h.simulate("SIGINT");
        h.simulate("SIGINT");
        expect(onForceKill).toHaveBeenCalled();
        h.dispose();
    });
    it("SIGHUP exits 129", () => {
        const onExit = vi.fn();
        const h = installSignalHandlers({ onTeardown: () => { }, onExit });
        h.simulate("SIGHUP");
        expect(onExit).toHaveBeenCalledWith(129);
        h.dispose();
    });
});
//# sourceMappingURL=handler.test.js.map