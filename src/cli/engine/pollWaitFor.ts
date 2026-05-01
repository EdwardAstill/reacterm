export interface PollOptions { timeoutMs: number; tickMs: number; }
export interface PollResult { matched: boolean; elapsedMs: number; }

export async function pollWaitFor(predicate: () => boolean, opts: PollOptions): Promise<PollResult> {
  const start = Date.now();
  while (Date.now() - start < opts.timeoutMs) {
    if (predicate()) return { matched: true, elapsedMs: Date.now() - start };
    await new Promise((r) => setTimeout(r, opts.tickMs));
  }
  return { matched: false, elapsedMs: Date.now() - start };
}
