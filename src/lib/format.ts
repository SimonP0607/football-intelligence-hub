export const EMPTY = "—";

export function pct(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EMPTY;
  return `${(value * 100).toFixed(digits)}%`;
}

export function signedPct(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EMPTY;
  const s = (value * 100).toFixed(digits);
  return `${value > 0 ? "+" : ""}${s}%`;
}

export function odds(value: number | null | undefined): string {
  if (value === null || value === undefined) return EMPTY;
  return value.toFixed(2);
}

export function num(value: number | null | undefined, digits = 3): string {
  if (value === null || value === undefined) return EMPTY;
  return value.toFixed(digits);
}

export function int(value: number | null | undefined): string {
  if (value === null || value === undefined) return EMPTY;
  return value.toLocaleString("en-US");
}

export function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function dateTimeOf(iso: string): string {
  return `${new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  })} ${timeOf(iso)} UTC`;
}
