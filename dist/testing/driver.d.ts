import React from "react";
import type { MouseEvent } from "../input/types.js";
import type { TestFrame, TestMetadata, TestSemanticNode } from "./metadata.js";
import { type ClickTarget, type TextMatcher } from "./queries.js";
export interface DriverOptions {
    width?: number;
    height?: number;
    artifactDir?: string;
}
export interface DriverTraceEntry {
    type: string;
    detail?: unknown;
    frame: number;
    screenHash: string;
}
export interface TuiDriver {
    readonly output: string;
    readonly lines: string[];
    readonly styledOutput: string;
    readonly metadata: TestMetadata;
    press(key: string, options?: {
        ctrl?: boolean;
        meta?: boolean;
        shift?: boolean;
        repeat?: number;
    }): TuiDriver;
    type(text: string): TuiDriver;
    paste(text: string): TuiDriver;
    click(target: ClickTarget, button?: MouseEvent["button"]): TuiDriver;
    scroll(direction: "up" | "down", target?: ClickTarget): TuiDriver;
    resize(width: number, height: number): TuiDriver;
    waitForText(text: TextMatcher): TuiDriver;
    waitForNoText(text: TextMatcher): TuiDriver;
    waitForIdle(): TuiDriver;
    waitForFrameChange(previousHash?: string): TuiDriver;
    expectText(text: TextMatcher): TuiDriver;
    expectNoText(text: TextMatcher): TuiDriver;
    expectFocused(matcher?: TextMatcher): TuiDriver;
    assertNoWarnings(): TuiDriver;
    assertNoOverlaps(): TuiDriver;
    getByText(text: TextMatcher): TestSemanticNode;
    getByRole(role: string, options?: {
        name?: TextMatcher;
    }): TestSemanticNode;
    getByLabel(label: TextMatcher): TestSemanticNode;
    getByTestId(testId: string): TestSemanticNode;
    getFocused(): TestSemanticNode | null;
    frames(): TestFrame[];
    trace(): DriverTraceEntry[];
    unmount(): void;
}
export declare function renderDriver(element: React.ReactElement, options?: DriverOptions): TuiDriver;
//# sourceMappingURL=driver.d.ts.map