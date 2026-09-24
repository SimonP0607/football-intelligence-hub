/**
 * Rendering the four honest statuses, API errors, and nulls.
 *
 * A null is never shown as 0 and never as a bare dash: it is a dash with the
 * reason in its tooltip, taken from the API.
 */
import { AlertTriangle, CircleSlash, Hourglass, Inbox, WifiOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { EMPTY } from "@/lib/format";
import { LiveApiError } from "@/lib/api/v1/client";
import type { DataStatus, Section } from "@/lib/api/v1/types";

const STATUS: Record<Exclude<DataStatus, "ok">, { title: string; Icon: typeof Inbox }> = {
  empty: { title: "Nothing here yet", Icon: Inbox },
  insufficient_data: { title: "Insufficient data", Icon: Hourglass },
  not_available: { title: "Not available yet", Icon: CircleSlash },
};

export function StatusNotice({
  status,
  reason,
  compact = false,
  className,
}: {
  status: DataStatus;
  reason: string | null;
  compact?: boolean | undefined;
  className?: string | undefined;
}) {
  if (status === "ok") return null;
  const { title, Icon } = STATUS[status];
  return (
    <div
      data-status={status}
      className={cn(
        "flex items-start gap-2.5 text-xs text-muted-foreground",
        compact ? "px-0 py-1" : "justify-center px-6 py-10 text-center flex-col items-center",
        className,
      )}
    >
      <Icon
        aria-hidden
        className={cn(
          "shrink-0 text-subtle-foreground",
          compact ? "mt-0.5 h-3.5 w-3.5" : "h-5 w-5",
        )}
      />
      <div>
        {!compact ? <div className="text-title text-foreground">{title}</div> : null}
        <p className={cn(compact ? "" : "mt-1 max-w-md")}>{reason ?? title}</p>
      </div>
    </div>
  );
}

/** Renders a Section: its data when ok, its reason otherwise. */
export function SectionView<T>({
  section,
  children,
  compact,
}: {
  section: Section<T>;
  children: (data: T) => React.ReactNode;
  compact?: boolean | undefined;
}) {
  if (section.status !== "ok") {
    return <StatusNotice status={section.status} reason={section.reason} compact={compact} />;
  }
  return <>{children(section.data)}</>;
}

export function ApiErrorNotice({ error, className }: { error: unknown; className?: string }) {
  const e = error instanceof LiveApiError ? error : null;
  const unreachable = e?.code === "unreachable";
  const Icon = unreachable ? WifiOff : AlertTriangle;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-md border border-negative/30 bg-negative-soft px-3 py-2.5 text-xs",
        className,
      )}
    >
      <Icon aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-negative" />
      <div className="text-foreground/85">
        <div className="font-medium text-foreground">
          {unreachable ? "API not reachable" : "The API returned an error"}
        </div>
        <p className="mt-0.5">
          {e ? e.message : "Unexpected error."}
          {e?.requestId ? <span className="numeric"> · request {e.requestId}</span> : null}
        </p>
        {unreachable ? (
          <p className="mt-1 text-muted-foreground">
            Nothing on this page is shown from memory or demo data while the API is down.
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** A value that may legitimately be absent. Absent shows "—" with the reason on hover. */
export function Nullable({
  value,
  reason,
  className,
}: {
  value: React.ReactNode | null | undefined;
  reason?: string | null;
  className?: string;
}) {
  if (value !== null && value !== undefined && value !== "") {
    return <span className={className}>{value}</span>;
  }
  if (!reason) return <span className={cn("text-subtle-foreground", className)}>{EMPTY}</span>;
  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`No value: ${reason}`}
            className={cn(
              "cursor-help text-subtle-foreground underline decoration-dotted underline-offset-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              className,
            )}
          >
            {EMPTY}
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs leading-relaxed">{reason}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
