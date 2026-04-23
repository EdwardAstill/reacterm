export interface UseStderrResult {
    stderr: NodeJS.WriteStream;
    write: (data: string) => void;
}
export declare function useStderr(): UseStderrResult;
//# sourceMappingURL=useStderr.d.ts.map