import { type TuiDriver } from "../../testing/index.js";
import type { Scenario } from "../schema/types.js";
export interface RunResult {
    status: "pass" | "fail";
    failure?: string;
    finalText: string;
    durationMs: number;
    /** Driver handle for in-process callers that want to capture artifacts.
     *  Stripped before serialization across process boundaries. */
    renderer?: TuiDriver;
}
export interface RunOptions {
    entry: string;
    scenario: Scenario;
    size?: {
        cols: number;
        rows: number;
    };
}
export declare function runScenarioFromCli(opts: RunOptions): Promise<RunResult>;
//# sourceMappingURL=runScenario.d.ts.map