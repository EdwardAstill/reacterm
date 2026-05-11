import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DEMO_COVERAGE,
  DEMO_COVERAGE_STATUSES,
  getDemoCoverage,
} from "../cli/demo/coverage.js";

function publicComponentAndWidgetExports(): string[] {
  const indexSource = readFileSync(new URL("../index.ts", import.meta.url), "utf8");
  const blocks = indexSource.match(/export \{[\s\S]*?\}\s+from "[^"]+";/g) ?? [];
  const names = new Set<string>();

  for (const block of blocks) {
    const sourcePath = block.match(/from "([^"]+)";/)?.[1] ?? "";
    if (!sourcePath.startsWith("./components/") && !sourcePath.startsWith("./widgets/")) {
      continue;
    }

    const body = block.match(/export \{([\s\S]*?)\}\s+from/)?.[1] ?? "";
    for (const rawPart of body.split(",")) {
      const part = rawPart.trim();
      if (!part || part.startsWith("type ")) continue;

      const name = part.split(/\s+as\s+/)[0]!.trim();
      if (/^[A-Z][A-Za-z0-9_]*$/.test(name) && /[a-z]/.test(name)) {
        names.add(name);
      }
    }
  }

  return [...names].sort();
}

describe("demo coverage matrix", () => {
  it("uses one explicit, valid status per entry", () => {
    const validStatuses = new Set(DEMO_COVERAGE_STATUSES);
    const seen = new Set<string>();

    for (const entry of DEMO_COVERAGE) {
      expect(validStatuses.has(entry.status), `${entry.name} has invalid status`).toBe(true);
      expect(seen.has(entry.name), `${entry.name} has duplicate coverage entries`).toBe(false);
      expect(entry.location.length, `${entry.name} needs a location`).toBeGreaterThan(0);
      expect(entry.note.length, `${entry.name} needs a note`).toBeGreaterThan(0);
      seen.add(entry.name);
    }
  });

  it("tracks every public component and widget export", () => {
    const missing = publicComponentAndWidgetExports()
      .filter((name) => getDemoCoverage(name) === undefined);

    expect(missing).toEqual([]);
  });

  it("keeps missing items explicit instead of silent", () => {
    const missing = DEMO_COVERAGE.filter((entry) => entry.status === "missing");
    expect(missing.map((entry) => entry.name)).toEqual([]);
  });
});
