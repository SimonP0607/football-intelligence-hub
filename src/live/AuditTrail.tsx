/**
 * Match Center -> Audit: the chain behind every number on the page, read from
 * GET /matches/{id}/audit. Every link shown is a stored hash or id; a step with
 * nothing to show says why, and "not applicable" (no pick, say) is not a gap.
 */
import { useState } from "react";
import { Panel, WarningBanner } from "@/components/primitives/Panel";
import { TableShell, THead, TH, TRow, TD, TableSkeleton } from "@/components/primitives/DataTable";
import { StatusBadge, type BadgeTone } from "@/components/primitives/StatusBadge";
import { useLiveQuery } from "@/components/system/dataSourcesContext";
import { ApiErrorNotice } from "@/components/system/LiveState";
import { live } from "@/lib/api/v1/queries";
import type { AuditItem, AuditScalar, AuditStepState, AuditTrailStep } from "@/lib/api/v1/types";
import { shortHash, utcDateTime } from "./format";

const STATE_TONE: Record<AuditStepState, BadgeTone> = {
  recorded: "positive",
  partial: "warning",
  missing: "negative",
  not_applicable: "neutral",
};
const STATE_LABEL: Record<AuditStepState, string> = {
  recorded: "Recorded",
  partial: "Partial",
  missing: "Missing",
  not_applicable: "Not applicable",
};
const PREVIEW = 8;
const HASHLIKE = /^[0-9a-f]{32,}$/;

function show(value: AuditScalar): string {
  if (value === null) return "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(4);
  if (HASHLIKE.test(value)) return shortHash(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return utcDateTime(value);
  return value;
}

function ref(item: AuditItem): string {
  return HASHLIKE.test(item.ref) ? shortHash(item.ref) : item.ref;
}

function link(l: string): string {
  const [kind, rest] = [l.slice(0, l.indexOf(":")), l.slice(l.indexOf(":") + 1)];
  return `${kind} ${HASHLIKE.test(rest) ? shortHash(rest) : rest}`;
}

function Facts({ facts }: { facts: Record<string, AuditScalar> }) {
  const entries = Object.entries(facts).filter(([, v]) => v !== null && v !== "");
  if (entries.length === 0) return <span className="text-subtle-foreground">—</span>;
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-0.5">
      {entries.map(([k, v]) => (
        <span key={k} className="whitespace-nowrap">
          <span className="text-subtle-foreground">{k.replaceAll("_", " ")}</span>{" "}
          <span className="numeric text-foreground/90">{show(v)}</span>
        </span>
      ))}
    </span>
  );
}

function StepItems({ step }: { step: AuditTrailStep }) {
  const [all, setAll] = useState(false);
  if (step.items.length === 0) return null;
  const items = all ? step.items : step.items.slice(0, PREVIEW);
  return (
    <div className="mt-2">
      <TableShell>
        <THead>
          <TH>Record</TH>
          <TH>When</TH>
          <TH>Facts</TH>
          <TH>Computed from</TH>
        </THead>
        <tbody>
          {items.map((it) => (
            <TRow key={`${it.kind}:${it.ref}`}>
              <TD>
                <span className="text-xs text-muted-foreground">
                  {it.kind.replaceAll("_", " ")}
                </span>
                <div className="numeric text-xs">{ref(it)}</div>
                {it.source ? (
                  <div className="text-caption text-subtle-foreground">{show(it.source)}</div>
                ) : null}
              </TD>
              <TD>
                <span className="numeric text-xs">{it.at ? utcDateTime(it.at) : "—"}</span>
              </TD>
              <TD>
                <div className="max-w-[34rem] text-xs">
                  <Facts facts={it.facts} />
                </div>
              </TD>
              <TD>
                <div className="flex flex-col gap-0.5 text-caption text-muted-foreground numeric">
                  {it.links.length ? it.links.map((l) => <span key={l}>{link(l)}</span>) : "—"}
                </div>
              </TD>
            </TRow>
          ))}
        </tbody>
      </TableShell>
      {step.items.length > PREVIEW ? (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          className="mt-1.5 text-caption text-primary hover:underline"
        >
          {all ? "Show fewer" : `Show all ${step.items.length} records`}
        </button>
      ) : null}
    </div>
  );
}

export function AuditTrail({ fixtureId }: { fixtureId: string }) {
  const q = useLiveQuery(live.audit(fixtureId));
  if (q.isLoading) return <TableSkeleton rows={9} cols={3} />;
  if (q.isError || !q.data) return <ApiErrorNotice error={q.error} />;
  const a = q.data.data;
  const gaps = a.steps.filter((s) => s.state === "missing" || s.state === "partial");
  return (
    <Panel
      title="Audit"
      subtitle="Provider → raw payload → normalised rows → features → model → prediction → market → pick → settlement, from stored hashes and ids only"
    >
      <div className="mb-3" data-testid="audit-summary">
        {a.complete ? (
          <StatusBadge tone="positive">Chain complete: nothing expected is missing</StatusBadge>
        ) : (
          <WarningBanner>
            {gaps.length} step{gaps.length === 1 ? "" : "s"} with a gap:{" "}
            {gaps.map((g) => g.label.toLowerCase()).join(", ")}. Each says why below.
          </WarningBanner>
        )}
      </div>
      <ol className="space-y-3">
        {a.steps.map((s, i) => (
          <li key={s.key} className="flex gap-3" data-step={s.key} data-state={s.state}>
            <div className="flex flex-col items-center">
              <span className="numeric flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border bg-elevated text-[0.6rem] text-muted-foreground">
                {i + 1}
              </span>
              {i < a.steps.length - 1 ? (
                <span aria-hidden className="my-1 w-px flex-1 bg-border" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 rounded-md border border-border bg-elevated/40 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm">{s.label}</span>
                <StatusBadge tone={STATE_TONE[s.state]}>{STATE_LABEL[s.state]}</StatusBadge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.detail}</p>
              <StepItems step={s} />
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
