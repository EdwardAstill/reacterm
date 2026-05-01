import * as fs from "fs";
import * as path from "path";
import { renderDriver } from "./driver.js";
import { writeFailureBundle } from "./artifacts.js";
import { renderToSvg } from "./svg-renderer.js";
export async function runScenario(definition, options) {
    const driverOptions = {};
    if (definition.terminal?.width !== undefined)
        driverOptions.width = definition.terminal.width;
    if (definition.terminal?.height !== undefined)
        driverOptions.height = definition.terminal.height;
    if (options.artifactDir !== undefined)
        driverOptions.artifactDir = options.artifactDir;
    const driver = renderDriver(options.app, driverOptions);
    try {
        for (const step of definition.steps) {
            runStep(driver, step, options.artifactDir);
        }
        return { passed: true, name: definition.name, trace: driver.trace() };
    }
    catch (error) {
        if (options.artifactDir !== undefined) {
            writeFailureBundle(driver, options.artifactDir);
        }
        return {
            passed: false,
            name: definition.name,
            trace: driver.trace(),
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }
    finally {
        driver.unmount();
    }
}
function runStep(driver, step, artifactDir) {
    if ("press" in step)
        driver.press(step.press, step.repeat === undefined ? undefined : { repeat: step.repeat });
    else if ("type" in step)
        driver.type(step.type);
    else if ("paste" in step)
        driver.paste(step.paste);
    else if ("click" in step)
        driver.click(step.click);
    else if ("scroll" in step)
        driver.scroll(step.scroll, step.target);
    else if ("resize" in step)
        driver.resize(step.resize.width, step.resize.height);
    else if ("expectText" in step)
        driver.expectText(step.expectText);
    else if ("expectNoText" in step)
        driver.expectNoText(step.expectNoText);
    else if ("waitForText" in step)
        driver.waitForText(step.waitForText);
    else if ("snapshotText" in step) {
        if (artifactDir !== undefined)
            writeArtifact(artifactDir, `${step.snapshotText}.txt`, driver.output);
        driver.waitForIdle();
    }
    else if ("snapshotSvg" in step) {
        if (artifactDir !== undefined) {
            const frame = driver.frames().at(-1);
            writeArtifact(artifactDir, `${step.snapshotSvg}.svg`, renderToSvg(driver.lines, driver.styledOutput, frame?.width ?? 80, frame?.height ?? 24));
        }
        driver.waitForIdle();
    }
    else if ("assertNoWarnings" in step)
        driver.assertNoWarnings();
    else if ("assertNoOverlaps" in step)
        driver.assertNoOverlaps();
}
function writeArtifact(dir, name, content) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, name), content, "utf-8");
}
//# sourceMappingURL=scenario.js.map