import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { loadEntry } from "../../engine/moduleLoader.js";

describe("loadEntry", () => {
  it("loads a .tsx file's default export as a React element", async () => {
    const fixture = resolve(__dirname, "../fixtures/hello-app.tsx");
    const element = await loadEntry(fixture, {});
    expect(element).toBeTruthy();
    expect((element as any).type).toBeTypeOf("function");
  });

  it("throws CliError with hint when file missing", async () => {
    await expect(loadEntry("/nope.tsx", {})).rejects.toMatchObject({
      message: expect.stringMatching(/no such file/),
      hint: expect.stringMatching(/cwd/),
    });
  });
});
