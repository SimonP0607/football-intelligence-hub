import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { DataState, ModelStatus, PickStatus } from "@/types/domain";

const badge = cva(
  "inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-caption font-medium uppercase tracking-wider whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-border-strong bg-muted text-muted-foreground",
        positive: "border-positive/35 bg-positive-soft text-positive",
        negative: "border-negative/35 bg-negative-soft text-negative",
        warning: "border-warning/35 bg-warning-soft text-warning",
        info: "border-info/35 bg-info-soft text-info",
        brand: "border-primary/35 bg-primary/12 text-primary",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badge>["tone"]>;

export function StatusBadge({
  children,
  tone,
  dot = true,
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={cn(badge({ tone }), className)}>
      {dot ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80" /> : null}
      {children}
    </span>
  );
}

const dataStateTone: Record<DataState, BadgeTone> = {
  healthy: "positive",
  warning: "warning",
  stale: "warning",
  failed: "negative",
  unknown: "neutral",
};

const dataStateLabel: Record<DataState, string> = {
  healthy: "Healthy",
  warning: "Warning",
  stale: "Stale",
  failed: "Failed",
  unknown: "Unknown",
};

export function DataStateBadge({ state, label }: { state: DataState; label?: string }) {
  return <StatusBadge tone={dataStateTone[state]}>{label ?? dataStateLabel[state]}</StatusBadge>;
}

const modelTone: Record<ModelStatus, BadgeTone> = {
  market_baseline: "info",
  validated: "positive",
  shadow: "brand",
  research: "warning",
  insufficient_data: "neutral",
  not_trained: "neutral",
};

const modelLabel: Record<ModelStatus, string> = {
  market_baseline: "Market baseline",
  validated: "Validated",
  shadow: "Shadow",
  research: "Research",
  insufficient_data: "Insufficient data",
  not_trained: "Not trained",
};

export function ModelBadge({ status }: { status: ModelStatus }) {
  return <StatusBadge tone={modelTone[status]}>{modelLabel[status]}</StatusBadge>;
}

const pickTone: Record<PickStatus, BadgeTone> = {
  candidate: "info",
  shadow: "brand",
  qualified: "positive",
  published: "positive",
  settled: "neutral",
  rejected: "negative",
};

export function PickStatusBadge({ status }: { status: PickStatus }) {
  return <StatusBadge tone={pickTone[status]}>{status}</StatusBadge>;
}
