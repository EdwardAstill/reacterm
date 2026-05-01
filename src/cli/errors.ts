export class CliError extends Error {
  hint?: string;
  exitCode: number;
  constructor(message: string, opts: { hint?: string; exitCode?: number } = {}) {
    super(message);
    if (opts.hint !== undefined) this.hint = opts.hint;
    this.exitCode = opts.exitCode ?? 1;
  }
}

export function formatError(e: unknown): string {
  if (e instanceof CliError) {
    return e.hint ? `error: ${e.message}\nhint: ${e.hint}` : `error: ${e.message}`;
  }
  return `error: ${(e as Error).message ?? String(e)}`;
}
