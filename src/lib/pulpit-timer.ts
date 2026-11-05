export type TimerAlert = "normal" | "warning" | "critical" | "over";

/** Orange border at 10 minutes left, red at 5 minutes left, overtime after zero. */
export function alertLevel(remainingSeconds: number): TimerAlert {
  if (remainingSeconds <= 0) return "over";
  if (remainingSeconds <= 5 * 60) return "critical";
  if (remainingSeconds <= 10 * 60) return "warning";
  return "normal";
}

export function formatClock(remainingSeconds: number): string {
  const abs = Math.abs(Math.round(remainingSeconds));
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  const txt = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return remainingSeconds < 0 ? `+${txt}` : txt;
}
