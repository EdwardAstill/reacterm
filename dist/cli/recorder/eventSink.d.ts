export type RecordedEvent = {
    t: number;
    kind: "key";
    key: string;
};
export declare class EventSink {
    events: RecordedEvent[];
    start: number;
    push(key: string): void;
}
//# sourceMappingURL=eventSink.d.ts.map