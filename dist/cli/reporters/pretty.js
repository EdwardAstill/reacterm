export function prettyReporter(results, _opts) {
    const lines = [];
    let passed = 0, failed = 0;
    for (const r of results) {
        if (r.status === "pass") {
            passed++;
            lines.push(`  ✓ ${r.name} (${r.durationMs}ms)`);
        }
        else {
            failed++;
            lines.push(`  ✗ ${r.name}: ${r.failure}`);
        }
    }
    lines.push("");
    lines.push(`${passed} passed, ${failed} failed`);
    return lines.join("\n");
}
//# sourceMappingURL=pretty.js.map