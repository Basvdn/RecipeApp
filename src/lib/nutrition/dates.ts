const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && DATE_RE.test(value) && !Number.isNaN(Date.parse(value));
}

/** YYYY-MM-DD for the given Date in the runtime's local timezone. */
export function toLocalIsoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Shift a YYYY-MM-DD date by whole days (calendar arithmetic, timezone-free). */
export function shiftIsoDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + days));
  return shifted.toISOString().slice(0, 10);
}
