export function tapReporter(results) {
    const lines = ["TAP version 13", `1..${results.length}`];
    results.forEach((r, i) => {
        const n = i + 1;
        if (r.status === "pass")
            lines.push(`ok ${n} - ${r.name}`);
        else
            lines.push(`not ok ${n} - ${r.name}\n  ---\n  failure: "${r.failure}"\n  ...`);
    });
    return lines.join("\n") + "\n";
}
//# sourceMappingURL=tap.js.map