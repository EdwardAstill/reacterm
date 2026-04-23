type TokenKind = "plain" | "keyword" | "type" | "string" | "comment" | "number" | "operator" | "preprocessor" | "tag";
interface Token {
    kind: TokenKind;
    text: string;
}
/** Check if WASM tokenizer acceleration is available. */
export declare function isWasmTokenizerAvailable(): boolean;
/**
 * Tokenize a single line of source code using the WASM accelerator.
 *
 * @param line     - The source line to tokenize (no trailing newline).
 * @param language - Language identifier ("typescript", "rust", "python", etc.).
 * @returns Token[] on success, or null if WASM is unavailable.
 *
 * The caller should fall back to the TypeScript tokenizer when this
 * returns null:
 *
 * ```ts
 * const tokens = wasmTokenizeLine(line, lang) ?? tsTokenizeLine(line, lang);
 * ```
 */
export declare function wasmTokenizeLine(line: string, language: string): Token[] | null;
export {};
//# sourceMappingURL=wasm-tokenizer.d.ts.map