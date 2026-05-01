import type { RunResult } from "../engine/runScenario.js";
type Named = RunResult & {
    name: string;
};
export declare function prettyReporter(results: Named[], _opts: {
    color: boolean;
}): string;
export {};
//# sourceMappingURL=pretty.d.ts.map