import type { RunResult } from "../engine/runScenario.js";
type Named = RunResult & {
    name: string;
};
export declare function jsonReporter(results: Named[]): string;
export {};
//# sourceMappingURL=json.d.ts.map