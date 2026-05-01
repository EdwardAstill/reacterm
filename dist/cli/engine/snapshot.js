import { readFileSync, writeFileSync, existsSync } from "node:fs";
export function capabilityFingerprint(size) {
    return { cols: size.cols, rows: size.rows };
}
export function writeSnapshot(path, content, size) {
    writeFileSync(path, content, "utf8");
    writeFileSync(path + ".fp.json", JSON.stringify(capabilityFingerprint(size)), "utf8");
}
export function compareSnapshot(path, actual, currentSize) {
    if (!existsSync(path))
        return { status: "drift", expected: "", actual };
    const expected = readFileSync(path, "utf8");
    const fpPath = path + ".fp.json";
    const storedFp = existsSync(fpPath)
        ? JSON.parse(readFileSync(fpPath, "utf8"))
        : { cols: currentSize.cols, rows: currentSize.rows };
    const currentFp = capabilityFingerprint(currentSize);
    if (storedFp.cols !== currentFp.cols || storedFp.rows !== currentFp.rows) {
        return { status: "capabilityMismatch", storedFp, currentFp };
    }
    if (expected === actual)
        return { status: "match" };
    return { status: "drift", expected, actual };
}
//# sourceMappingURL=snapshot.js.map