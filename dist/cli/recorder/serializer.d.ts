import type { Step } from "../schema/types.js";
export interface RecorderResult {
    name: string;
    entry: string;
    size: {
        cols: number;
        rows: number;
    };
    steps: Step[];
}
export declare function eventsToScenarioYaml(r: RecorderResult): Promise<string>;
//# sourceMappingURL=serializer.d.ts.map