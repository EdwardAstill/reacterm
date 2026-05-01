import { renderDriver } from "./driver.js";
export async function exploreForTest(element, options = {}) {
    const driverOptions = {};
    if (options.terminal?.width !== undefined)
        driverOptions.width = options.terminal.width;
    if (options.terminal?.height !== undefined)
        driverOptions.height = options.terminal.height;
    const driver = renderDriver(element, driverOptions);
    const maxDepth = options.maxDepth ?? 20;
    const actions = options.actions ?? ["tab", "enter", "escape", "up", "down"];
    const visited = new Set();
    const failures = [];
    let actionsTried = 0;
    try {
        for (let i = 0; i < maxDepth; i++) {
            visited.add(driver.metadata.screenHash);
            const action = actions[i % actions.length];
            try {
                driver.press(action);
                actionsTried++;
                visited.add(driver.metadata.screenHash);
                collectInvariantFailures(driver.output, driver.metadata.warnings, failures);
            }
            catch (error) {
                failures.push(error instanceof Error ? error.message : String(error));
            }
        }
        return {
            framesVisited: visited.size,
            actionsTried,
            failures,
            visitedHashes: [...visited],
        };
    }
    finally {
        driver.unmount();
    }
}
function collectInvariantFailures(output, warnings, failures) {
    if (output.trim().length === 0)
        failures.push("not-blank invariant failed");
    if (warnings.length > 0)
        failures.push(`no-warning invariant failed: ${warnings.join("; ")}`);
}
//# sourceMappingURL=explorer.js.map