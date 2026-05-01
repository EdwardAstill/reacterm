export async function pollWaitFor(predicate, opts) {
    const start = Date.now();
    while (Date.now() - start < opts.timeoutMs) {
        if (predicate())
            return { matched: true, elapsedMs: Date.now() - start };
        await new Promise((r) => setTimeout(r, opts.tickMs));
    }
    return { matched: false, elapsedMs: Date.now() - start };
}
//# sourceMappingURL=pollWaitFor.js.map