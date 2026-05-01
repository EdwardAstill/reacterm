import * as fs from "fs";
import * as path from "path";
import { renderToSvg } from "./svg-renderer.js";
export function writeFailureBundle(driver, dir, options) {
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
function write(filePath, content) {
    fs.writeFileSync(filePath, content, "utf-8");
    return filePath;
}
//# sourceMappingURL=artifacts.js.map