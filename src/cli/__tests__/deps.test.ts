import { describe, it, expect } from "vitest";

describe("CLI dependencies", () => {
  it("commander is importable", async () => {
    const mod = await import("commander");
    expect(typeof mod.Command).toBe("function");
  });
  it("zod is importable", async () => {
    const mod = await import("zod");
    expect(typeof mod.z.object).toBe("function");
  });
  it("js-yaml is importable", async () => {
    const mod = await import("js-yaml");
    const load = (mod as any).load ?? (mod as any).default?.load;
    expect(typeof load).toBe("function");
  });
});
