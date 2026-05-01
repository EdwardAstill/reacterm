type Sig = "SIGINT" | "SIGTERM" | "SIGHUP";
const EXITS: Record<Sig, number> = { SIGINT: 130, SIGTERM: 143, SIGHUP: 129 };

export interface SignalOpts {
  onTeardown: () => void;
  onExit: (code: number) => void;
  onForceKill?: () => void;
  escalateWindowMs?: number;
}

export function installSignalHandlers(opts: SignalOpts) {
  let firstAt: number | null = null;
  const win = opts.escalateWindowMs ?? 2000;
  const handle = (sig: Sig) => {
    const now = Date.now();
    if (firstAt !== null && now - firstAt < win) {
      opts.onForceKill?.();
      opts.onExit(EXITS[sig]!);
      return;
    }
    firstAt = now;
    opts.onTeardown();
    opts.onExit(EXITS[sig]!);
  };
  const listeners: Array<[Sig, (..._a: unknown[]) => void]> = [];
  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"] as Sig[]) {
    const fn = () => handle(sig);
    process.on(sig, fn);
    listeners.push([sig, fn]);
  }
  return {
    simulate: (sig: Sig) => handle(sig),
    dispose: () => listeners.forEach(([_s, f]) => process.off(_s, f)),
  };
}
