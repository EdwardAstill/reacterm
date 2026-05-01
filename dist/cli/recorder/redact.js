export function applyRedact(text, pattern) {
    return pattern ? text.replace(pattern, "[REDACTED]") : text;
}
//# sourceMappingURL=redact.js.map