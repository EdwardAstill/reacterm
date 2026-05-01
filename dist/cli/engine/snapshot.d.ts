export interface CapabilityFingerprint {
    cols: number;
    rows: number;
}
export declare function capabilityFingerprint(size: {
    cols: number;
    rows: number;
}): CapabilityFingerprint;
export declare function writeSnapshot(path: string, content: string, size: {
    cols: number;
    rows: number;
}): void;
export type CompareResult = {
    status: "match";
} | {
    status: "drift";
    expected: string;
    actual: string;
} | {
    status: "capabilityMismatch";
    storedFp: CapabilityFingerprint;
    currentFp: CapabilityFingerprint;
};
export declare function compareSnapshot(path: string, actual: string, currentSize: {
    cols: number;
    rows: number;
}): CompareResult;
//# sourceMappingURL=snapshot.d.ts.map