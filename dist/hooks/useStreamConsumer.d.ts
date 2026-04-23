export interface UseStreamConsumerOptions {
    /** Call start() to begin consuming */
    autoStart?: boolean;
}
export interface UseStreamConsumerResult {
    text: string;
    isStreaming: boolean;
    isDone: boolean;
    error: string | null;
    start: (stream: AsyncIterable<string>) => void;
    cancel: () => void;
    reset: () => void;
}
export declare function useStreamConsumer(_options?: UseStreamConsumerOptions): UseStreamConsumerResult;
//# sourceMappingURL=useStreamConsumer.d.ts.map