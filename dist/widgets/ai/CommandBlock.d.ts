import React from "react";
export interface CommandBlockProps {
    command: string;
    output?: React.ReactNode;
    /** Exit code (0 = success, non-zero = error). */
    exitCode?: number;
    /** Duration in milliseconds. */
    duration?: number;
    collapsed?: boolean;
    /** Toggle callback for collapse/expand. */
    onToggle?: () => void;
    isFocused?: boolean;
    /** Callback fired when the user presses "c" while focused. Receives the output text. */
    onCopy?: (text: string) => void;
    /** When true, pass output through without stripping ANSI codes. */
    ansiOutput?: boolean;
    /** Custom render for the command header row. */
    renderHeader?: (command: string, exitCode?: number) => React.ReactNode;
    /** Override collapse/expand toggle indicators (defaults: "▸" / "▾"). */
    toggleIndicators?: {
        collapsed?: string;
        expanded?: string;
    };
    /** Override exit code symbols (defaults: "✓" / "✗"). */
    exitCodeSymbols?: {
        success?: string;
        failure?: string;
    };
}
export declare const CommandBlock: React.NamedExoticComponent<CommandBlockProps>;
//# sourceMappingURL=CommandBlock.d.ts.map