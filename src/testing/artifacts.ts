import * as fs from "fs";
import * as path from "path";
import { renderToSvg, type SvgOptions } from "./svg-renderer.js";
import type { TuiDriver } from "./driver.js";

export interface FailureBundleOptions {
  svg?: SvgOptions;
}

export function writeFailureBundle(
  driver: TuiDriver,
  dir: string,
  options?: FailureBundleOptions,
): string[] {
  fs.mkdirSync(dir, { recursive: true });
  const files = [
    write(path.join(dir, "screen.txt"), driver.output),
    write(path.join(dir, "styled.ansi"), driver.styledOutput),
    write(path.join(dir, "screen.svg"), renderToSvg(driver.lines, driver.styledOutput, driver.metadata.frames.at(-1)?.width ?? 80, driver.metadata.frames.at(-1)?.height ?? 24, options?.svg)),
    write(path.join(dir, "frames.json"), JSON.stringify(driver.frames(), null, 2)),
    write(path.join(dir, "trace.json"), JSON.stringify(driver.trace(), null, 2)),
  ];
  return files;
}

function write(filePath: string, content: string): string {
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}
