const RE = /^(\d+)(ms|s|m)$/;
const UNITS = { ms: 1, s: 1000, m: 60_000 };
export function parseDuration(input) {
    const m = RE.exec(input);
    if (!m) {
        if (/\./.test(input))
            throw new Error(`duration must be an integer with a unit suffix: ${input}`);
        throw new Error(`duration must end with a unit (ms|s|m): ${input}`);
    }
    const [, value, unit] = m;
    return Number(value) * UNITS[unit];
}
//# sourceMappingURL=duration.js.map