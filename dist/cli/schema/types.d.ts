export type ScrollDirection = "up" | "down";
export type ClickTarget = {
    x: number;
    y: number;
};
export type Step = {
    kind: "press";
    keys: string[];
} | {
    kind: "type";
    text: string;
} | {
    kind: "paste";
    text: string;
} | {
    kind: "click";
    x: number;
    y: number;
    button?: "left" | "right" | "middle";
} | {
    kind: "scroll";
    direction: ScrollDirection;
    target?: ClickTarget;
} | {
    kind: "resize";
    cols: number;
    rows: number;
} | {
    kind: "waitFor";
    text: string;
    timeoutMs?: number;
} | {
    kind: "sleep";
    ms: number;
} | {
    kind: "snapshot";
    as: "svg" | "text" | "json";
    path: string;
};
export type Expectation = {
    kind: "contains";
    text: string;
} | {
    kind: "line";
    at: number;
    equals?: string;
    contains?: string;
    matches?: string;
} | {
    kind: "expectSnapshot";
    path: string;
} | {
    kind: "exitCode";
    code: number;
} | {
    kind: "noWarnings";
} | {
    kind: "frameCount";
    min?: number;
    max?: number;
};
export interface Scenario {
    version: 1;
    name: string;
    entry?: string;
    size?: {
        cols: number;
        rows: number;
    };
    env?: Record<string, string>;
    timeoutMs?: number;
    steps: Step[];
    expect?: Expectation[];
}
//# sourceMappingURL=types.d.ts.map