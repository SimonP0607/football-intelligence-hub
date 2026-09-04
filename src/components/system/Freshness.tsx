import { Activity, Check, Clock, HelpCircle, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DataState, Freshness } from "@/types/domain";

const config: Record<
  Freshness,
  { label: string; className: string; Icon: typeof Check; description: string }
> = {
  live: {
    label: "Live",
    className: "border-info/35 bg-info-soft text-info",
    Icon: Activity,
    description: "Streaming updates in progress",
  },
  fresh: {
    label: "Fresh",
    className: "border-positive/35 bg-positive-soft text-positive",
    Icon: Check,
    description: "Captured within the freshness threshold",
  },
  aging: {
    label: "Aging",
    className: "border-warning/35 bg-warning-soft text-warning",
    Icon: Clock,
    description: "Approaching the freshness threshold",
  },
  stale: {
    label: "Stale",
    className: "border-negative/35 bg-negative-soft text-negative",
    Icon: TriangleAlert,
    description: "Older than the freshness threshold",
  },
  unknown: {
    label: "Unknown",
    className: "border-border-strong bg-muted text-muted-foreground",
    Icon: HelpCircle,
    description: "No capture recorded",
  },
};

/** Text + icon + colour. Colour is never the only carrier of meaning. */
export function FreshnessBadge({
  freshness,
  detail,
  className,
}: {
  freshness: Freshness;
  detail?: string;
  className?: string;
}) {
  const { label, className: tone, Icon, description } = config[freshness];
  return (
    <span
      title={detail ?? description}
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-caption font-medium uppercase tracking-wider whitespace-nowrap",
        tone,
        className,
      )}
    >
      <Icon aria-hidden className="h-3 w-3" />
      {label}
      <span className="sr-only">{` — ${description}`}</span>
    </span>
  );
}

/** Maps the coarse DataState vocabulary onto the freshness scale. */
export function freshnessFromState(state: DataState): Freshness {
  switch (state) {
    case "healthy":
      return "fresh";
    case "warning":
      return "aging";
    case "stale":
      return "stale";
    case "failed":
      return "stale";
    default:
      return "unknown";
  }
}

export const freshnessOrder: Freshness[] = ["live", "fresh", "aging", "stale", "unknown"];
