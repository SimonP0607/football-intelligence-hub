import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

function shift(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Matchday navigation: previous / today / next plus a direct date picker. */
export function DateNav({
  value,
  today,
  onChange,
  className,
}: {
  value: string;
  today: string;
  onChange: (iso: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-md border border-border bg-card p-1",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Previous day"
        onClick={() => onChange(shift(value, -1))}
        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange(today)}
        aria-pressed={value === today}
        className={cn(
          "rounded px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          value === today
            ? "bg-primary/12 text-primary"
            : "text-muted-foreground hover:bg-elevated hover:text-foreground",
        )}
      >
        Today
      </button>
      <button
        type="button"
        aria-label="Next day"
        onClick={() => onChange(shift(value, 1))}
        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <span className="mx-1 hidden h-4 w-px bg-border sm:block" />
      <label className="flex items-center gap-1.5 pl-1 pr-1.5">
        <CalendarDays aria-hidden className="h-3.5 w-3.5 text-subtle-foreground" />
        <span className="sr-only">Select date</span>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="numeric h-7 rounded border border-border bg-card px-1.5 text-xs text-foreground focus:border-border-strong focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </label>
    </div>
  );
}
