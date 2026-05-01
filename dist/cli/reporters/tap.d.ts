import type { RunResult } from "../engine/runScenario.js";
type Named = RunResult & {
    name: string;
};
export declare function tapReporter(results: Named[]): string;
export {};
//# sourceMappingURL=tap.d.ts.map