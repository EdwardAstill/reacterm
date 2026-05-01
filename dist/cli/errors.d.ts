export declare class CliError extends Error {
    hint?: string;
    exitCode: number;
    constructor(message: string, opts?: {
        hint?: string;
        exitCode?: number;
    });
}
export declare function formatError(e: unknown): string;
//# sourceMappingURL=errors.d.ts.map