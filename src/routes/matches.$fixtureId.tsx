import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel, KeyValue, EmptyState, WarningBanner } from "@/components/primitives/Panel";
import { TableShell, THead, TH, TRow, TD, TableSkeleton } from "@/components/primitives/DataTable";
import { DataStateBadge, ModelBadge, StatusBadge } from "@/components/primitives/StatusBadge";
import {
  EdgeIndicator,
  EVIndicator,
  FormStrip,
  Numeric,
  OddsCell,
  ProbabilityComparison,
  ProvenanceChip,
  TeamBadge,
} from "@/components/primitives/Indicators";
import { api } from "@/lib/api/resources";
import { EMPTY, dateTimeOf, num, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TeamRatings } from "@/types/domain";

export const Route = createFileRoute("/matches/$fixtureId")({
  head: () => ({
    meta: [
      { title: "Match Center — Football Intelligence" },
      {
        name: "description",
        content:
          "Fixture-level intelligence: model versus market probabilities, market table, team ratings and full prediction provenance.",
      },
      { property: "og:title", content: "Match Center — Football Intelligence" },
      {
        property: "og:description",
        content: "Model versus market intelligence for a single fixture, with full audit trail.",
      },
    ],
  }),
  component: MatchCenter,
});

const tabs = ["Overview", "Markets", "Models", "Team Data", "Timeline", "Audit"] as const;
type Tab = (typeof tabs)[number];

function MatchCenter() {
  const { fixtureId } = Route.useParams();
  const [tab, setTab] = useState<Tab>("Overview");

  const fixture = useQuery({
    queryKey: ["match", fixtureId],
    queryFn: () => api.match(fixtureId),
  });
  const markets = useQuery({
    queryKey: ["match-markets", fixtureId],
    queryFn: () => api.matchMarkets(fixtureId),
  });
  const prediction = useQuery({
    queryKey: ["match-prediction", fixtureId],
    queryFn: () => api.matchPrediction(fixtureId),
  });
  const snapshot = useQuery({
    queryKey: ["match-odds", fixtureId],
    queryFn: () => api.matchOddsSnapshot(fixtureId),
  });
  const ratings = useQuery({
    queryKey: ["match-ratings", fixtureId],
    queryFn: () => api.matchRatings(fixtureId),
  });

  if (fixture.isLoading) {
    return (
      <Panel>
        <TableSkeleton rows={10} cols={4} />
      </Panel>
    );
  }

  const f = fixture.data;
  if (!f) {
    return (
      <Panel>
        <EmptyState
          title="Fixture not found"
          description="This fixture id is not present in the demo dataset. Once the FastAPI adapter is active, unknown ids will resolve against the real fixture store."
        />
      </Panel>
    );
  }

  const p = prediction.data;
  const oneX2 = (markets.data ?? []).filter((m) => m.market === "1x2");

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumb={[
          { label: "Operations" },
          { label: "Matches", to: "/matches" },
          { label: f.id },
        ]}
        title={`${f.home.name} vs ${f.away.name}`}
        description={`${f.competition.name} · ${f.round} · ${dateTimeOf(f.kickoff)}`}
        actions={
          <>
            <ModelBadge status={f.modelStatus} />
            <DataStateBadge state={f.dataQuality} label={`Data ${f.dataQuality}`} />
            <StatusBadge tone="warning">Demo data</StatusBadge>
          </>
        }
      />

      <div className="surface-panel grid gap-4 p-4 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center gap-3">
          <TeamBadge code={f.home.code} />
          <div>
            <div className="text-heading">{f.home.name}</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-caption text-subtle-foreground">Form</span>
              <FormStrip form={ratings.data?.home.form ?? []} />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center px-4">
          <span className="text-label text-subtle-foreground">{f.status}</span>
          <span className="numeric text-lg">{dateTimeOf(f.kickoff).split(" ").slice(2).join(" ")}</span>
        </div>
        <div className="flex items-center justify-end gap-3 text-right">
          <div>
            <div className="text-heading">{f.away.name}</div>
            <div className="mt-1 flex items-center justify-end gap-2">
              <FormStrip form={ratings.data?.away.form ?? []} />
              <span className="text-caption text-subtle-foreground">Form</span>
            </div>
          </div>
          <TeamBadge code={f.away.code} />
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors",
              tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" ? (
        <div className="space-y-5">
          <Panel
            title="Probability hero — model vs market"
            subtitle="Model probability is engine output. Market probability is the overround-removed consensus. They are not interchangeable."
          >
            {p ? (
              <ProbabilityComparison
                outcomes={[
                  { label: "Home", model: p.probabilities.home, market: p.marketProbabilities.home },
                  { label: "Draw", model: p.probabilities.draw, market: p.marketProbabilities.draw },
                  { label: "Away", model: p.probabilities.away, market: p.marketProbabilities.away },
                ]}
              />
            ) : (
              <TableSkeleton rows={3} cols={3} />
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <ProvenanceChip label="Model" value={p?.model ?? EMPTY} />
              <ProvenanceChip label="Version" value={p?.modelVersion ?? EMPTY} />
              <ProvenanceChip label="Cutoff" value={p ? dateTimeOf(p.dataCutoff) : EMPTY} />
              <ProvenanceChip
                label="Odds snapshot"
                value={snapshot.data ? dateTimeOf(snapshot.data.capturedAt) : EMPTY}
              />
            </div>
          </Panel>

          <div className="grid gap-5 lg:grid-cols-3">
            <Panel title="1X2 market detail" className="lg:col-span-2" bodyClassName="">
              <MarketTable rows={oneX2} />
            </Panel>
            <Panel title="Snapshot context">
              <KeyValue label="Bookmakers" value={snapshot.data?.bookmakerCount ?? EMPTY} />
              <KeyValue label="Overround" value={num(snapshot.data?.overround ?? null, 3)} />
              <KeyValue
                label="Near-close"
                value={snapshot.data?.nearClose ? "yes" : "no (T-12m pending)"}
              />
              <KeyValue label="Market coverage" value={pct(f.marketCoverage, 0)} />
              <KeyValue label="Odds state" value={f.oddsState} />
              <div className="mt-3">
                <WarningBanner>
                  This capture is not a validated near-close snapshot, so no line-value claim is
                  made for this fixture.
                </WarningBanner>
              </div>
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === "Markets" ? (
        <Panel
          title="Market intelligence"
          subtitle="Edge is only shown where a model probability and an available price both exist."
          bodyClassName=""
        >
          <MarketTable rows={markets.data ?? []} grouped />
        </Panel>
      ) : null}

      {tab === "Models" ? (
        <Panel title="Models applied to this fixture">
          <div className="space-y-3">
            {[
              { name: "Market Baseline", status: "market_baseline" as const, note: "Reference consensus" },
              { name: "Poisson (bivariate) v0.4.2-rc1", status: "shadow" as const, note: "Producing this fixture's probabilities" },
              { name: "Elo v0.3.1", status: "shadow" as const, note: "Running in parallel, not used for candidates" },
              { name: "Dixon-Coles v0.2.0", status: "research" as const, note: "Insufficient sample for this competition" },
            ].map((m) => (
              <div
                key={m.name}
                className="flex items-center justify-between rounded-md border border-border bg-elevated/40 px-3 py-2.5"
              >
                <div>
                  <div className="text-sm">{m.name}</div>
                  <div className="text-caption text-subtle-foreground">{m.note}</div>
                </div>
                <ModelBadge status={m.status} />
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {tab === "Team Data" ? (
        <Panel title="Team intelligence" subtitle="Rating parameters used by the goal-process model">
          <RatingsTable home={ratings.data?.home} away={ratings.data?.away} />
        </Panel>
      ) : null}

      {tab === "Timeline" ? (
        <Panel title="Fixture timeline">
          <ol className="space-y-3">
            {[
              ["11:00 UTC", "Fixture ingested from provider", "healthy"],
              ["11:45 UTC", "Feature snapshot built", "healthy"],
              ["12:00 UTC", "Data cutoff applied", "healthy"],
              ["12:03 UTC", "Odds snapshot captured (14 books)", "healthy"],
              ["12:04 UTC", "Prediction emitted (shadow)", "healthy"],
              ["T-12m", "Near-close capture", "unknown"],
              ["Kickoff", "Live coverage", "unknown"],
            ].map(([time, label, state]) => (
              <li key={label} className="flex items-start gap-3">
                <Numeric className="w-24 shrink-0 text-xs" muted>
                  {time}
                </Numeric>
                <span
                  className={cn(
                    "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                    state === "healthy" ? "bg-primary" : "bg-border-strong",
                  )}
                />
                <span
                  className={cn(
                    "text-sm",
                    state === "healthy" ? "text-foreground" : "text-subtle-foreground",
                  )}
                >
                  {label}
                  {state !== "healthy" ? " — not available yet" : ""}
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      ) : null}

      {tab === "Audit" ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <Panel
            title="Provenance chain"
            subtitle="Every prediction must be reproducible from this chain"
            className="lg:col-span-2"
          >
            <ol className="space-y-1">
              {[
                ["Provider", "API-Football · fixtures + odds"],
                ["Raw payload", p?.rawPayloadHash ?? EMPTY],
                ["Normalized fixture", f.id],
                ["Feature snapshot", p?.featureVersion ?? EMPTY],
                ["Prediction", p?.id ?? EMPTY],
                ["Odds snapshot", p?.oddsSnapshotId ?? EMPTY],
                ["Decision", "shadow — no publication"],
              ].map(([step, value], i, arr) => (
                <li key={step} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <span className="numeric flex h-6 w-6 items-center justify-center rounded-full border border-border bg-elevated text-[0.6rem] text-muted-foreground">
                      {i + 1}
                    </span>
                    {i < arr.length - 1 ? <span className="h-6 w-px bg-border" /> : null}
                  </div>
                  <div className="pb-2">
                    <div className="text-title">{step}</div>
                    <div className="numeric text-xs text-muted-foreground">{value}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
          <Panel title="Reproducibility record">
            <KeyValue label="Prediction ID" value={p?.id ?? EMPTY} />
            <KeyValue label="Model" value={p?.model ?? EMPTY} />
            <KeyValue label="Model version" value={p?.modelVersion ?? EMPTY} />
            <KeyValue label="Feature version" value={p?.featureVersion ?? EMPTY} />
            <KeyValue label="Calibrator" value={p?.calibrator ?? EMPTY} />
            <KeyValue label="Data cutoff" value={p ? dateTimeOf(p.dataCutoff) : EMPTY} />
            <KeyValue label="Odds snapshot" value={p?.oddsSnapshotId ?? EMPTY} />
            <KeyValue
              label="Captured at"
              value={snapshot.data ? dateTimeOf(snapshot.data.capturedAt) : EMPTY}
            />
            <KeyValue label="Raw payload hash" value={p?.rawPayloadHash ?? EMPTY} />
            <KeyValue label="Git SHA" value={p?.gitSha ?? EMPTY} />
          </Panel>
        </div>
      ) : null}
    </div>
  );
}

function MarketTable({
  rows,
  grouped,
}: {
  rows: Array<import("@/types/domain").MarketProbability>;
  grouped?: boolean;
}) {
  if (rows.length === 0) return <TableSkeleton rows={4} cols={8} />;
  return (
    <TableShell>
      <THead>
        {grouped ? <TH>Market</TH> : null}
        <TH>Selection</TH>
        <TH align="right">Model prob</TH>
        <TH align="right">Market prob</TH>
        <TH align="right">Fair odds</TH>
        <TH align="right">Best odds</TH>
        <TH align="right">Edge</TH>
        <TH align="right">EV</TH>
      </THead>
      <tbody>
        {rows.map((m) => (
          <TRow key={`${m.market}-${m.selection}`}>
            {grouped ? (
              <TD className="text-xs text-muted-foreground">{m.marketLabel}</TD>
            ) : null}
            <TD className="text-sm">{m.selection}</TD>
            <TD align="right">
              <Numeric>{pct(m.modelProbability)}</Numeric>
            </TD>
            <TD align="right">
              <Numeric muted>{pct(m.marketProbability)}</Numeric>
            </TD>
            <TD align="right">
              <OddsCell value={m.fairOdds} fair />
            </TD>
            <TD align="right">
              <OddsCell value={m.bestOdds} bookmaker={m.bookmaker} />
            </TD>
            <TD align="right">
              <EdgeIndicator value={m.edge} />
            </TD>
            <TD align="right">
              <EVIndicator value={m.ev} />
            </TD>
          </TRow>
        ))}
      </tbody>
    </TableShell>
  );
}

function RatingsTable({ home, away }: { home?: TeamRatings; away?: TeamRatings }) {
  if (!home || !away) return <TableSkeleton rows={7} cols={3} />;
  const rows: Array<[string, string, string]> = [
    ["Elo", String(home.elo), String(away.elo)],
    ["Attack rating", num(home.attackRating, 2), num(away.attackRating, 2)],
    ["Defense rating", num(home.defenseRating, 2), num(away.defenseRating, 2)],
    ["Home/Away strength", num(home.homeAwayStrength, 2), num(away.homeAwayStrength, 2)],
    ["Goals for (avg)", num(home.goalsFor, 2), num(away.goalsFor, 2)],
    ["Goals against (avg)", num(home.goalsAgainst, 2), num(away.goalsAgainst, 2)],
    ["Schedule strength", num(home.scheduleStrength, 2), num(away.scheduleStrength, 2)],
    ["xG", "Not available", "Not available"],
  ];
  return (
    <TableShell>
      <THead>
        <TH>Metric</TH>
        <TH align="right">Home</TH>
        <TH align="right">Away</TH>
      </THead>
      <tbody>
        {rows.map(([label, h, a]) => (
          <TRow key={label}>
            <TD className="text-xs text-muted-foreground">{label}</TD>
            <TD align="right">
              {h === "Not available" ? (
                <span className="text-caption text-subtle-foreground">Not available</span>
              ) : (
                <Numeric>{h}</Numeric>
              )}
            </TD>
            <TD align="right">
              {a === "Not available" ? (
                <span className="text-caption text-subtle-foreground">Not available</span>
              ) : (
                <Numeric>{a}</Numeric>
              )}
            </TD>
          </TRow>
        ))}
      </tbody>
    </TableShell>
  );
}
