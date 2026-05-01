const RE = /^(\d+)(ms|s|m)$/;
const UNITS: Record<string, number> = { ms: 1, s: 1000, m: 60_000 };

export function parseDuration(input: string): number {
  const m = RE.exec(input);
  if (!m) {
    if (/\./.test(input)) throw new Error(`duration must be an integer with a unit suffix: ${input}`);
    throw new Error(`duration must end with a unit (ms|s|m): ${input}`);
  }
  return Number(m[1]) * UNITS[m[2]];
}
