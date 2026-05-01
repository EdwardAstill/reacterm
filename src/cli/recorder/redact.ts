export function applyRedact(text: string, pattern: RegExp | undefined): string {
  return pattern ? text.replace(pattern, "[REDACTED]") : text;
}
