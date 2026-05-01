import type { RunResult } from "../engine/runScenario.js";
type Named = RunResult & {
    name: string;
};
export declare function ndjsonReporter(results: Named[]): string;
export {};
//# sourceMappingURL=ndjson.d.ts.map