type Sig = "SIGINT" | "SIGTERM" | "SIGHUP";
export interface SignalOpts {
    onTeardown: () => void;
    onExit: (code: number) => void;
    onForceKill?: () => void;
    escalateWindowMs?: number;
}
export declare function installSignalHandlers(opts: SignalOpts): {
    simulate: (sig: Sig) => void;
    dispose: () => void;
};
export {};
//# sourceMappingURL=handler.d.ts.map