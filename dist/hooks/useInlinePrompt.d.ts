export interface UseInlinePromptOptions<T extends string = string> {
    choices: Record<string, T>;
    isActive?: boolean;
    timeoutMs?: number;
    timeoutChoice?: string;
}
export interface UseInlinePromptResult<T extends string = string> {
    selected: T | null;
    countdown: number | null;
    select: (key: string) => void;
    reset: () => void;
}
export declare function useInlinePrompt<T extends string = string>(options: UseInlinePromptOptions<T>): UseInlinePromptResult<T>;
//# sourceMappingURL=useInlinePrompt.d.ts.map