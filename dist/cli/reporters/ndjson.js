export function ndjsonReporter(results) {
    const lines = [];
    lines.push(JSON.stringify({ type: "start", schemaVersion: 1 }));
    for (const r of results) {
        lines.push(JSON.stringify({ type: r.status, name: r.name, durationMs: r.durationMs, failure: r.failure }));
    }
    const passed = results.filter((r) => r.status === "pass").length;
    lines.push(JSON.stringify({ type: "summary", passed, failed: results.length - passed, total: results.length }));
    return lines.join("\n") + "\n";
}
//# sourceMappingURL=ndjson.js.map