import React from "react";
export interface ApprovalOption {
    key: string;
    label: string;
    color: string;
}
export interface ApprovalPromptProps {
    tool: string;
    risk?: string;
    params?: Record<string, unknown>;
    /** Default: y/n/a. */
    options?: ApprovalOption[];
    onSelect: (key: string) => void;
    /** Terminal width for dividers (unused — Divider auto-fills). */
    width?: number;
    /** Whether the prompt captures keyboard input (default true). */
    visible?: boolean;
    /** Timeout in ms. When set, auto-deny after timeout with countdown display. */
    timeout?: number;
    /** Custom render for each approval option. */
    renderOption?: (option: ApprovalOption, index: number) => React.ReactNode;
    /** Custom timeout message formatter (default: ``(s) => `Auto-deny in ${s}s` ``). */
    timeoutMessage?: (seconds: number) => string;
}
export declare const ApprovalPrompt: React.NamedExoticComponent<ApprovalPromptProps>;
//# sourceMappingURL=ApprovalPrompt.d.ts.map