import React from "react";
export interface StatusLineSegment {
    text: string;
    color?: string;
    bg?: string;
}
export interface StatusLineProps {
    left?: React.ReactNode;
    right?: React.ReactNode;
    brand?: string;
    model?: string;
    tokens?: number;
    turns?: number;
    extra?: Record<string, string | number>;
    backgroundColor?: string;
    segments?: StatusLineSegment[];
    renderSegment?: (segment: StatusLineSegment, index: number) => React.ReactNode;
    /** Default: "▶". */
    powerlineSeparator?: string;
}
export declare const StatusLine: React.NamedExoticComponent<StatusLineProps>;
//# sourceMappingURL=StatusLine.d.ts.map