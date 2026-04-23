export interface UseTimerOptions {
    mode: "countdown" | "stopwatch";
    durationMs?: number;
    onComplete?: () => void;
    autoStart?: boolean;
}
export interface UseTimerResult {
    elapsedMs: number;
    remainingMs: number;
    formatted: string;
    isRunning: boolean;
    start: () => void;
    pause: () => void;
    reset: () => void;
}
export declare function useTimer(options: UseTimerOptions): UseTimerResult;
//# sourceMappingURL=useTimer.d.ts.map