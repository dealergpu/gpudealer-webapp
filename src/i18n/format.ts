/**
 * Fills `{name}` placeholders in a translated string:
 * `fmt("{count} available", { count: 4 })` → "4 available".
 * Unknown placeholders are left as-is so a missing value is visible, not silent.
 */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
