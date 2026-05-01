export class CliError extends Error {
    hint;
    exitCode;
    constructor(message, opts = {}) {
        super(message);
        if (opts.hint !== undefined)
            this.hint = opts.hint;
        this.exitCode = opts.exitCode ?? 1;
    }
}
export function formatError(e) {
    if (e instanceof CliError) {
        return e.hint ? `error: ${e.message}\nhint: ${e.hint}` : `error: ${e.message}`;
    }
    return `error: ${e.message ?? String(e)}`;
}
//# sourceMappingURL=errors.js.map