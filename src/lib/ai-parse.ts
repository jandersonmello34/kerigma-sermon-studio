/** Split a model reply into non-empty, trimmed lines. */
export function lines(reply: string): string[] {
  return reply
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");
}

/** Split one line into its two `|||`-separated fields; null unless exactly two non-empty fields. */
export function splitFields(line: string): [string, string] | null {
  const parts = line.split("|||").map((p) => p.trim());
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return [parts[0], parts[1]];
}
