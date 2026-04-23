export interface UseStdinResult {
    stdin: NodeJS.ReadStream;
    setRawMode: (value: boolean) => void;
    isRawModeSupported: boolean;
}
export declare function useStdin(): UseStdinResult;
//# sourceMappingURL=useStdin.d.ts.map