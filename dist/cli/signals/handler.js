const EXITS = { SIGINT: 130, SIGTERM: 143, SIGHUP: 129 };
export function installSignalHandlers(opts) {
    let firstAt = null;
    const win = opts.escalateWindowMs ?? 2000;
    const handle = (sig) => {
        const now = Date.now();
        if (firstAt !== null && now - firstAt < win) {
            opts.onForceKill?.();
            opts.onExit(EXITS[sig]);
            return;
        }
        firstAt = now;
        opts.onTeardown();
        opts.onExit(EXITS[sig]);
    };
    const listeners = [];
    for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
        const fn = () => handle(sig);
        process.on(sig, fn);
        listeners.push([sig, fn]);
    }
    return {
        simulate: (sig) => handle(sig),
        dispose: () => listeners.forEach(([_s, f]) => process.off(_s, f)),
    };
}
//# sourceMappingURL=handler.js.map