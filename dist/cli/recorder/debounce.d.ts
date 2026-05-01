type Ev = {
    t: number;
    kind: "key";
    key: string;
};
type Step = {
    kind: "press";
    keys: string[];
} | {
    kind: "type";
    text: string;
};
export declare function coalesceKeystrokes(events: Ev[], windowMs: number): Step[];
export {};
//# sourceMappingURL=debounce.d.ts.map