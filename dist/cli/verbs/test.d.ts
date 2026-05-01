export interface TestOpts {
    paths: string[];
    reporter: "pretty" | "json" | "ndjson" | "tap";
    stdout: NodeJS.WritableStream;
    stderr: NodeJS.WritableStream;
    jobs: number;
    ci?: boolean;
    updateSnapshots?: boolean;
}
export declare function runTest(opts: TestOpts): Promise<number>;
//# sourceMappingURL=test.d.ts.map