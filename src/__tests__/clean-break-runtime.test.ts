import { describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { basename } from "node:path";
import { tmpdir } from "node:os";
import { PluginBus } from "../core/plugin.js";
import { RenderContext } from "../core/render-context.js";
import { ScreenBuffer } from "../core/buffer.js";
import { colors } from "../theme/colors.js";
import { screenshotPlugin } from "../plugins/screenshot.js";

describe("Reacterm runtime branding", () => {
  it("prefixes runtime warnings with [reacterm]", () => {
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const bus = new PluginBus();
    bus.on("broken", () => {
      throw new Error("boom");
    });

    try {
      bus.emit("broken", undefined);
      expect(stderr).toHaveBeenCalledWith(
        '[reacterm] PluginBus error on channel "broken": boom\n',
      );
    } finally {
      stderr.mockRestore();
    }
  });

  it("uses reacterm-screenshot as the generated file prefix", () => {
    const outputDir = mkdtempSync(`${tmpdir()}/reacterm-screenshot-test-`);
    let capturedPath: string | undefined;
    const renderContext = new RenderContext();
    renderContext.buffer = new ScreenBuffer(2, 1);
    const plugin = screenshotPlugin({
      outputDir,
      onCapture: (filePath) => {
        capturedPath = filePath;
      },
    });

    try {
      plugin.setup?.({
        registerElement: () => {},
        addShortcut: () => {},
        renderContext,
        theme: colors,
        bus: new PluginBus(),
      }, undefined);
      plugin.onKey?.({
        key: "S",
        char: "S",
        raw: "S",
        ctrl: true,
        shift: true,
        meta: false,
      });

      expect(capturedPath).toBeDefined();
      expect(basename(capturedPath!)).toMatch(/^reacterm-screenshot-.*\.svg$/);
    } finally {
      plugin.cleanup?.();
      renderContext.dispose();
      rmSync(outputDir, { recursive: true, force: true });
    }
  });
});
