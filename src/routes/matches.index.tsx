import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel, EmptyState } from "@/components/primitives/Panel";
import { TableShell, THead, TH, TRow, TD, TableSkeleton } from "@/components/primitives/DataTable";
import { DataStateBadge, ModelBadge, StatusBadge } from "@/components/primitives/StatusBadge";
import { CompetitionBadge, Numeric, TeamBadge } from "@/components/primitives/Indicators";
import { queries } from "@/lib/api/resources";
import { competitions } from "@/mock/data";
import { pct, timeOf } from "@/lib/format";
import type { FixtureStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/matches/")({
  head: () => ({
    meta: [
      { title: "Matches — Football Intelligence" },
      {
        name: "description",
        content:
          "Monitored fixtures with model availability, odds coverage and data quality per match.",
      },
      { property: "og:title", content: "Matches — Football Intelligence" },
      {
        property: "og:description",
        content: "Monitored fixtures with model availability and odds coverage.",
      },
    ],
  }),
  component: MatchesPage,
});

const statusTabs: Array<{ key: FixtureStatus | "all"; label: string }> = [
  { key: "upcoming", label: "Upcoming" },
  { key: "live", label: "Live" },
  { key: "finished", label: "Finished" },
  { key: "all", label: "All" },
];

function MatchesPage() {
  const matches = useQuery(queries.matches);
  const [status, setStatus] = useState<FixtureStatus | "all">("upcoming");
  const [competition, setCompetition] = useState<string>("all");
  const [oddsOnly, setOddsOnly] = useState(false);
  const [modelOnly, setModelOnly] = useState(false);

  const rows = useMemo(() => {
    return (matches.data ?? []).filter((f) => {
      if (status !== "all" && f.status !== status) return false;
      if (competition !== "all" && f.competition.id !== competition) return false;
      if (oddsOnly && f.oddsState === "stale") return false;
      if (modelOnly && f.modelStatus === "insufficient_data") return false;
      return true;
    });
  }, [matches.data, status, competition, oddsOnly, modelOnly]);

  const selectCls =
    "h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumb={[{ label: "Operations" }, { label: "Matches" }]}
        title="Matches"
        description="Every fixture the ingestion layer is tracking, with the state of its model output, prices and data quality."
        actions={<StatusBadge tone="warning">Demo data</StatusBadge>}
      />

      <div className="surface-panel flex flex-wrap items-center gap-3 px-3 py-2.5">
        <div className="flex rounded-md border border-border p-0.5">
          {statusTabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setStatus(t.key)}
              className={cn(
                "rounded px-2.5 py-1 text-xs transition-colors",
                status === t.key
                  ? "bg-elevated text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {t.key === "live" ? (
                <span className="ml-1.5 text-caption text-subtle-foreground">n/a</span>
              ) : null}
            </button>
          ))}
        </div>

        <input type="date" defaultValue="2026-09-04" className={selectCls} aria-label="Date" />

        <select
          className={selectCls}
          value={competition}
          onChange={(e) => setCompetition(e.target.value)}
          aria-label="Competition"
        >
          <option value="all">All competitions</option>
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={modelOnly}
            onChange={(e) => setModelOnly(e.target.checked)}
            className="accent-[var(--primary)]"
          />
          Model available
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={oddsOnly}
            onChange={(e) => setOddsOnly(e.target.checked)}
            className="accent-[var(--primary)]"
          />
          Odds available
        </label>

        <span className="numeric ml-auto text-caption text-subtle-foreground">
          {rows.length} fixtures
        </span>
      </div>

      <Panel bodyClassName="">
        {matches.isLoading ? (
          <TableSkeleton rows={8} cols={8} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No fixtures match these filters"
            description="Live coverage is not implemented yet — the ingestion layer only produces pre-match snapshots at this stage."
          />
        ) : (
          <TableShell>
            <THead>
              <TH>Time</TH>
              <TH>Competition</TH>
              <TH>Fixture</TH>
              <TH>Status</TH>
              <TH>Model</TH>
              <TH>Odds</TH>
              <TH align="right">Markets</TH>
              <TH>Data quality</TH>
              <TH align="right">Actions</TH>
            </THead>
            <tbody>
              {rows.map((f) => (
                <TRow key={f.id}>
                  <TD>
                    <Numeric>{timeOf(f.kickoff)}</Numeric>
                  </TD>
                  <TD>
                    <CompetitionBadge code={f.competition.shortCode} name={f.competition.name} />
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <TeamBadge code={f.home.code} name={f.home.name} />
                      <span className="text-subtle-foreground">vs</span>
                      <TeamBadge code={f.away.code} name={f.away.name} />
                    </div>
                    <div className="text-caption text-subtle-foreground">{f.round}</div>
                  </TD>
                  <TD className="text-xs capitalize text-muted-foreground">{f.status}</TD>
                  <TD>
                    <ModelBadge status={f.modelStatus} />
                  </TD>
                  <TD>
                    <DataStateBadge state={f.oddsState} />
                  </TD>
                  <TD align="right">
                    <Numeric>{pct(f.marketCoverage, 0)}</Numeric>
                    <div className="text-caption text-subtle-foreground">
                      {f.bookmakerCount} books
                    </div>
                  </TD>
                  <TD>
                    <DataStateBadge state={f.dataQuality} />
                  </TD>
                  <TD align="right">
                    <Link
                      to="/matches/$fixtureId"
                      params={{ fixtureId: f.id }}
                      className="rounded border border-border px-2 py-1 text-caption text-muted-foreground hover:border-primary/40 hover:text-primary"
                    >
                      Match center
                    </Link>
                  </TD>
                </TRow>
              ))}
            </tbody>
          </TableShell>
        )}
      </Panel>
    </div>
  );
}
