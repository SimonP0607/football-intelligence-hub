import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { glossary, type GlossaryKey } from "@/lib/glossary";

/** Metric label with an accessible definition from the shared glossary. */
export function InfoTip({
  term,
  children,
  className,
}: {
  term: GlossaryKey;
  children?: React.ReactNode;
  className?: string;
}) {
  const text = glossary[term];
  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`What is ${String(children ?? term)}: ${text}`}
            className={cn(
              "inline-flex items-center gap-1 rounded text-inherit focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              className,
            )}
          >
            {children}
            <Info aria-hidden className="h-3 w-3 shrink-0 opacity-50" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs leading-relaxed">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Column header variant: keeps the table header typography intact. */
export function MetricLabel({
  term,
  children,
}: {
  term: GlossaryKey;
  children: React.ReactNode;
}) {
  return (
    <InfoTip term={term} className="text-label font-semibold text-subtle-foreground">
      {children}
    </InfoTip>
  );
}
