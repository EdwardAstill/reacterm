export interface TreeSitterTokenizer {
    tokenize(code: string, language: string): TreeSitterToken[];
    isLanguageAvailable(language: string): boolean;
    loadLanguage(language: string): Promise<boolean>;
}
export interface TreeSitterToken {
    type: "keyword" | "string" | "comment" | "number" | "operator" | "function" | "type" | "variable" | "tag" | "attribute" | "punctuation" | "plain";
    text: string;
    startIndex: number;
    endIndex: number;
}
/**
 * Return the active tree-sitter tokenizer, or `null` if tree-sitter
 * has not been enabled (or failed to load).
 */
export declare function getTreeSitter(): TreeSitterTokenizer | null;
/**
 * Attempt to load tree-sitter at runtime.
 *
 * If `web-tree-sitter` is not installed this is a safe no-op — the
 * regex tokenizer remains in use.
 */
export declare function enableTreeSitter(): Promise<void>;
//# sourceMappingURL=tree-sitter.d.ts.map