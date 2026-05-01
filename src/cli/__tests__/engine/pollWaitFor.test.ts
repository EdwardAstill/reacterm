import { describe, it, expect } from "vitest";
import { pollWaitFor } from "../../engine/pollWaitFor.js";

describe("pollWaitFor", () => {
  it("resolves when predicate true on first tick", async () => {
    const { matched, elapsedMs } = await pollWaitFor(() => true, { timeoutMs: 1000, tickMs: 16 });
    expect(matched).toBe(true);
    expect(elapsedMs).toBeLessThan(50);
  });

  it("polls until predicate flips true", async () => {
    let n = 0;
    const { matched } = await pollWaitFor(() => ++n > 5, { timeoutMs: 1000, tickMs: 10 });
    expect(matched).toBe(true);
    expect(n).toBeGreaterThanOrEqual(6);
  });

  it("returns {matched:false} after timeout", async () => {
    const t0 = Date.now();
    const { matched, elapsedMs } = await pollWaitFor(() => false, { timeoutMs: 100, tickMs: 16 });
    expect(matched).toBe(false);
    expect(elapsedMs).toBeGreaterThanOrEqual(100);
    expect(Date.now() - t0).toBeLessThan(300);
  });
});
