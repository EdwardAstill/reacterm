import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface KeyboardHelpProps extends StormLayoutStyleProps {
    bindings: Array<{
        key: string;
        label: string;
    }>;
    separator?: string;
    keyColor?: string | number;
    /** When provided, render as a header above the bindings: "[context mode]" */
    context?: string;
    /** Number of columns to arrange bindings in. 0 = auto (single row). */
    columns?: number;
    /** Custom render for each key binding. */
    renderBinding?: (key: string, label: string) => React.ReactNode;
}
export declare const KeyboardHelp: React.NamedExoticComponent<KeyboardHelpProps>;
//# sourceMappingURL=KeyboardHelp.d.ts.map