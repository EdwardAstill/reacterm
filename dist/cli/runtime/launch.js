import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const RUNNER = resolve(HERE, "../../../bin/reacterm-run-module.mjs");
export function resolveSiblingModule(fromImportMetaUrl, relativeStem) {
    const baseDir = dirname(fileURLToPath(fromImportMetaUrl));
    const candidates = [
        resolve(baseDir, `${relativeStem}.js`),
        resolve(baseDir, `${relativeStem}.ts`),
        resolve(baseDir, `${relativeStem}.tsx`),
        resolve(baseDir, relativeStem),
    ];
    for (const candidate of candidates) {
        if (existsSync(candidate))
            return candidate;
    }
    return candidates[0];
}
export function spawnModuleAsMain(modulePath, args = [], options = {}) {
    return spawn(process.execPath, [RUNNER, modulePath, ...args], options);
}
export function spawnModuleAsMainSync(modulePath, args = [], options = {}) {
    return spawnSync(process.execPath, [RUNNER, modulePath, ...args], options);
}
//# sourceMappingURL=launch.js.map