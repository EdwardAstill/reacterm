import React from "react";
import type { StormColors } from "../../theme/colors.js";
import type { HighlightSpan } from "../../components/core/TextArea.js";
export type { LanguageDef } from "./syntax-languages.js";
export { registerLanguage, getLanguage, getSupportedLanguages } from "./syntax-languages.js";
export interface SyntaxHighlightProps {
    code: string;
    language?: string;
    width?: number;
    /** Visible height in lines. When set, wraps in ScrollView for native scrolling. */
    height?: number;
}
export declare function createSyntaxHighlightLines(code: string, language: string, colors: StormColors): HighlightSpan[][];
export declare const SyntaxHighlight: React.NamedExoticComponent<SyntaxHighlightProps>;
//# sourceMappingURL=SyntaxHighlight.d.ts.map