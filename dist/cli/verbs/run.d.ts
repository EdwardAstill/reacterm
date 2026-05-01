import { type RecordedEvent } from "../recorder/eventSink.js";
export interface RunOpts {
    entry: string;
    capture?: string;
    includeSnapshots?: boolean;
    redact?: RegExp;
    debounceMs?: number;
    size?: {
        cols: number;
        rows: number;
    };
    /** Test-only: bypass TTY interaction by providing pre-seeded events. */
    _testEvents?: RecordedEvent[];
}
export declare function runRun(opts: RunOpts): Promise<number>;
//# sourceMappingURL=run.d.ts.map