import { readFileSync, writeFileSync, existsSync } from "node:fs";

export interface CapabilityFingerprint { cols: number; rows: number; }

export function capabilityFingerprint(size: { cols: number; rows: number }): CapabilityFingerprint {
  return { cols: size.cols, rows: size.rows };
}

export function writeSnapshot(path: string, content: string, size: { cols: number; rows: number }): void {
  writeFileSync(path, content, "utf8");
  writeFileSync(path + ".fp.json", JSON.stringify(capabilityFingerprint(size)), "utf8");
}

export type CompareResult =
  | { status: "match" }
  | { status: "drift"; expected: string; actual: string }
  | { status: "capabilityMismatch"; storedFp: CapabilityFingerprint; currentFp: CapabilityFingerprint };

export function compareSnapshot(path: string, actual: string, currentSize: { cols: number; rows: number }): CompareResult {
  if (!existsSync(path)) return { status: "drift", expected: "", actual };
  const expected = readFileSync(path, "utf8");
  const fpPath = path + ".fp.json";
  const storedFp: CapabilityFingerprint = existsSync(fpPath)
    ? JSON.parse(readFileSync(fpPath, "utf8"))
    : { cols: currentSize.cols, rows: currentSize.rows };
  const currentFp = capabilityFingerprint(currentSize);
  if (storedFp.cols !== currentFp.cols || storedFp.rows !== currentFp.rows) {
    return { status: "capabilityMismatch", storedFp, currentFp };
  }
  if (expected === actual) return { status: "match" };
  return { status: "drift", expected, actual };
}
