import { Database, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL, USING_DEMO_DATA } from "@/lib/api/client";

export type DataMode = "demo" | "live";

export const dataMode: DataMode = USING_DEMO_DATA ? "demo" : "live";

/**
 * Global, discreet indicator of the data source. The same component renders
 * LIVE DATA once VITE_API_BASE_URL points at the FastAPI service.
 */
export function DataModeBadge({
  className,
  withDetail = false,
}: {
  className?: string;
  withDetail?: boolean;
}) {
  const demo = dataMode === "demo";
  const Icon = demo ? FlaskConical : Database;
  return (
    <span
      title={
        demo
          ? "Demo data. Every figure is synthetic and produced by the mock adapter."
          : `Live data from ${API_BASE_URL}`
      }
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-caption font-medium uppercase tracking-wider whitespace-nowrap",
        demo
          ? "border-warning/35 bg-warning-soft text-warning"
          : "border-positive/35 bg-positive-soft text-positive",
        className,
      )}
    >
      <Icon aria-hidden className="h-3 w-3" />
      {demo ? "Demo data" : "Live data"}
      {withDetail ? (
        <span className="numeric normal-case tracking-normal opacity-70">
          {demo ? "mock adapter" : API_BASE_URL}
        </span>
      ) : null}
    </span>
  );
}
