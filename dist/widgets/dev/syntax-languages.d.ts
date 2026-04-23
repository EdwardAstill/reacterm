export interface LanguageDef {
    /** Set of language keywords to highlight. */
    keywords: Set<string>;
    /** Set of type-level keywords (e.g. built-in types) highlighted differently. */
    typeKeywords?: Set<string>;
    /** Line comment prefix (e.g. "//"). */
    lineComment?: string;
    /** Block comment opening delimiter (e.g. "\/\*"). */
    blockCommentStart?: string;
    /** Block comment closing delimiter (e.g. "\*\/"). */
    blockCommentEnd?: string;
    /** String delimiter characters (e.g. ['"', "'"]). */
    stringDelimiters?: string[];
    /** Whether the language supports JS/TS-style template literals. */
    hasTemplateLiterals?: boolean;
    /** Multiline string delimiter (e.g. '"""'). */
    multilineStringDelimiter?: string;
    /** Preprocessor directive prefix (e.g. "#"). */
    preprocessorPrefix?: string;
}
export interface InternalLanguageDef {
    keywords: Set<string>;
    typeKeywords: Set<string>;
    lineComment: string[];
    blockCommentOpen: string;
    blockCommentClose: string;
    multilineStringDelims: string[];
    hasTemplateLiterals: boolean;
    hasPreprocessor: boolean;
    stringChars: string[];
    jsxAware: boolean;
    /** When true, keyword lookups normalize the word to lowercase before checking the set. */
    caseInsensitiveKeywords: boolean;
}
export declare const EMPTY_SET: Set<string>;
/**
 * Register a custom language definition.
 *
 * @param name - Canonical name for the language.
 * @param aliases - Additional aliases (e.g. ["js", "jsx"] for JavaScript).
 * @param def - Language definition.
 */
export declare function registerLanguage(name: string, aliases: string[], def: LanguageDef): void;
export declare function getLanguage(name: string): LanguageDef | undefined;
export declare function getSupportedLanguages(): string[];
export declare function getLanguageDef(lang: string): InternalLanguageDef;
//# sourceMappingURL=syntax-languages.d.ts.map