import type { TestMetadata, TestSemanticNode } from "./metadata.js";
export type TextMatcher = string | RegExp;
export interface RoleQuery {
    role: string;
    name?: TextMatcher;
}
export type ClickTarget = {
    x: number;
    y: number;
} | {
    role: string;
    name?: TextMatcher;
} | {
    label: TextMatcher;
} | {
    text: TextMatcher;
} | {
    testId: string;
};
export declare function getByText(metadata: TestMetadata, text: TextMatcher): TestSemanticNode;
export declare function queryByText(metadata: TestMetadata, text: TextMatcher): TestSemanticNode | null;
export declare function getByRole(metadata: TestMetadata, role: string, options?: {
    name?: TextMatcher;
}): TestSemanticNode;
export declare function getByLabel(metadata: TestMetadata, label: TextMatcher): TestSemanticNode;
export declare function getByTestId(metadata: TestMetadata, testId: string): TestSemanticNode;
export declare function getFocused(metadata: TestMetadata): TestSemanticNode | null;
export declare function resolveClickTarget(metadata: TestMetadata, target: ClickTarget): {
    x: number;
    y: number;
};
export declare function matches(matcher: TextMatcher, value: string): boolean;
//# sourceMappingURL=queries.d.ts.map