import React from "react";
import { type DriverTraceEntry } from "./driver.js";
import type { ClickTarget } from "./queries.js";
export type ScenarioStep = {
    press: string;
    repeat?: number;
} | {
    type: string;
} | {
    paste: string;
} | {
    click: ClickTarget;
} | {
    scroll: "up" | "down";
    target?: ClickTarget;
} | {
    resize: {
        width: number;
        height: number;
    };
} | {
    expectText: string;
} | {
    expectNoText: string;
} | {
    waitForText: string;
} | {
    snapshotText: string;
} | {
    snapshotSvg: string;
} | {
    assertNoWarnings: true;
} | {
    assertNoOverlaps: true;
};
export interface ScenarioDefinition {
    name: string;
    terminal?: {
        width?: number;
        height?: number;
    };
    steps: ScenarioStep[];
    artifacts?: string[];
}
export interface ScenarioRunOptions {
    app: React.ReactElement;
    artifactDir?: string;
}
export interface ScenarioRunResult {
    passed: boolean;
    name: string;
    trace: DriverTraceEntry[];
    error?: Error;
}
export declare function runScenario(definition: ScenarioDefinition, options: ScenarioRunOptions): Promise<ScenarioRunResult>;
//# sourceMappingURL=scenario.d.ts.map