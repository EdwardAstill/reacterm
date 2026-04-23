export interface UseEasedIntervalOptions {
    durations: number[];
    onTick: (frameIndex: number) => void;
    active?: boolean;
}
export interface UseEasedIntervalResult {
    frame: number;
    restart: () => void;
    pause: () => void;
    resume: () => void;
}
export declare function useEasedInterval(options: UseEasedIntervalOptions): UseEasedIntervalResult;
//# sourceMappingURL=useEasedInterval.d.ts.map