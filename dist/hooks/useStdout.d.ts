export interface UseStdoutResult {
    stdout: NodeJS.WriteStream;
    write: (data: string) => void;
}
export declare function useStdout(): UseStdoutResult;
//# sourceMappingURL=useStdout.d.ts.map