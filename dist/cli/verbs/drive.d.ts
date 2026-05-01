import type { Step } from "../schema/types.js";
import type { CaptureFmt } from "../engine/capture.js";
export interface DriveOpts {
    entry: string;
    inline?: Step[];
    scriptPath?: string;
    capture: CaptureFmt;
    stdout: NodeJS.WritableStream;
    stderr: NodeJS.WritableStream;
    size?: {
        cols: number;
        rows: number;
    };
    timeoutMs?: number;
    keepAlive?: boolean;
}
export declare function runDrive(opts: DriveOpts): Promise<number>;
//# sourceMappingURL=drive.d.ts.map