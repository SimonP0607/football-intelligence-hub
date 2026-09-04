import { cn } from "@/lib/utils";
import { EMPTY } from "@/lib/format";

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("surface-panel flex flex-col overflow-hidden", className)}>
      {title ? (
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-title">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 text-caption text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn("min-w-0 flex-1", bodyClassName ?? "p-4")}>{children}</div>
    </section>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  tone = "default",
  footer,
}: {
  label: string;
  value: string | null;
  hint?: string;
  tone?: "default" | "positive" | "negative" | "warning" | "muted";
  footer?: React.ReactNode;
}) {
  const toneClass = {
    default: "text-foreground",
    positive: "text-positive",
    negative: "text-negative",
    warning: "text-warning",
    muted: "text-muted-foreground",
  }[tone];
  return (
    <div className="surface-panel px-4 py-3">
      <div className="text-label text-subtle-foreground">{label}</div>
      <div className={cn("mt-1.5 numeric-lg", toneClass)}>{value ?? EMPTY}</div>
      {hint ? <div className="mt-1 text-caption text-muted-foreground">{hint}</div> : null}
      {footer ? <div className="mt-2">{footer}</div> : null}
    </div>
  );
}

export function KeyValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-1.5 last:border-0">
      <span className="text-caption uppercase tracking-wider text-subtle-foreground">{label}</span>
      <span className="numeric truncate text-xs text-foreground">{value}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {icon ? <div className="text-subtle-foreground">{icon}</div> : null}
      <h3 className="text-title">{title}</h3>
      <p className="max-w-md text-xs text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

export function WarningBanner({
  children,
  tone = "warning",
}: {
  children: React.ReactNode;
  tone?: "warning" | "info";
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border px-3 py-2 text-xs",
        tone === "warning"
          ? "border-warning/30 bg-warning-soft text-warning"
          : "border-info/30 bg-info-soft text-info",
      )}
    >
      <span aria-hidden className="mt-px">
        ⚠
      </span>
      <span className="text-foreground/85">{children}</span>
    </div>
  );
}
