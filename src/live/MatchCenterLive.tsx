import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { KeyValue, Panel, WarningBanner } from "@/components/primitives/Panel";
import { TableShell, THead, TH, TRow, TD, TableSkeleton } from "@/components/primitives/DataTable";
import { StatusBadge } from "@/components/primitives/StatusBadge";
import { Numeric } from "@/components/primitives/Indicators";
import { SegmentedTabs } from "@/components/system/Filters";
import { AuditTimeline, EventTimeline, type AuditStep } from "@/components/system/Timelines";
import { useLiveQuery } from "@/components/system/dataSourcesContext";
import { ApiErrorNotice, Nullable, SectionView } from "@/components/system/LiveState";
import { live } from "@/lib/api/v1/queries";
import { LiveApiError } from "@/lib/api/v1/client";
import type { MatchDetail } from "@/lib/api/v1/types";
import { int } from "@/lib/format";
import { dec, decPct, relative, shortHash, utcDateTime } from "./format";
import { ScoreText, StatusGroupBadge } from "./shared";

const tabs = ["Overview", "Markets", "Models", "Timeline", "Lineage"] as const;
type Tab = (typeof tabs)[number];

export function MatchCenterLive({ fixtureId }: { fixtureId: string }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const q = useLiveQuery(live.match(fixtureId));

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Match Center" description="Loading fixture…" />
        <TableSkeleton rows={6} cols={4} />
      </div>
    );
  }
  if (q.isError || !q.data) {
    const notFound = q.error instanceof LiveApiError && q.error.status === 404;
    return (
      <div className="space-y-4">
        <PageHeader
          breadcrumb={[{ label: "Matches", to: "/matches" }, { label: `Fixture ${fixtureId}` }]}
          title={notFound ? "Fixture not found" : "Match Center"}
          description={
            notFound ? `No stored fixture has id ${fixtureId}.` : "The fixture could not be loaded."
          }
        />
        {!notFound ? <ApiErrorNotice error={q.error} /> : null}
      </div>
    );
  }

  const d = q.data.data;
  const m = d.match;
  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb={[
          { label: "Matches", to: "/matches" },
          { label: `${m.home.name} v ${m.away.name}` },
        ]}
        title={`${m.home.name} v ${m.away.name}`}
        description={`${m.competition.name}${m.round ? ` · ${m.round}` : ""} · ${utcDateTime(m.kickoff_at)}`}
        actions={<StatusGroupBadge match={m} />}
      />

      {m.awaiting_result ? (
        <WarningBanner>
          This fixture kicked off {relative(m.kickoff_at)} and is still recorded as {m.status_short}
          . Its result has not been synced; on the free plan it becomes unreachable about a day
          after kick-off.
        </WarningBanner>
      ) : null}

      <SegmentedTabs label="Match sections" tabs={tabs} value={tab} onChange={setTab} />

      {tab === "Overview" ? <OverviewTab d={d} /> : null}
      {tab === "Markets" ? <MarketsTab d={d} /> : null}
      {tab === "Models" ? <ModelsTab d={d} /> : null}
      {tab === "Timeline" ? (
        <Panel
          title="Timeline"
          subtitle="What the system observed for this fixture, in order. Windows the plan cannot reach are marked, not counted as missed."
        >
          <EventTimeline
            events={d.timeline.map((e) => ({
              id: e.key,
              label: e.label,
              detail: e.detail,
              at: e.at,
              state: e.state,
            }))}
          />
        </Panel>
      ) : null}
      {tab === "Lineage" ? <LineageTab d={d} /> : null}
    </div>
  );
}

function OverviewTab({ d }: { d: MatchDetail }) {
  const m = d.match;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel title="Result" className="lg:col-span-2">
        <div className="flex flex-col items-center gap-3 py-4 sm:flex-row sm:justify-center sm:gap-8">
          <div className="text-center text-sm font-medium sm:w-48 sm:text-right">{m.home.name}</div>
          <div className="text-3xl">
            {m.score ? (
              <ScoreText score={m.score} />
            ) : (
              <span
                className="numeric text-subtle-foreground"
                title="No score has been recorded for this fixture."
              >
                – : –
              </span>
            )}
          </div>
          <div className="text-center text-sm font-medium sm:w-48 sm:text-left">{m.away.name}</div>
        </div>
        {m.score ? (
          <div className="grid gap-x-6 sm:grid-cols-2">
            <KeyValue
              label="Half time"
              value={
                <Nullable
                  value={m.score.ht_home === null ? null : `${m.score.ht_home}–${m.score.ht_away}`}
                  reason="Half-time score not provided."
                />
              }
            />
            <KeyValue label="Outcome (90 min)" value={m.score.outcome_1x2} />
            <KeyValue
              label="Extra time"
              value={
                <Nullable
                  value={m.score.et_home === null ? null : `${m.score.et_home}–${m.score.et_away}`}
                  reason="No extra time was played."
                />
              }
            />
            <KeyValue
              label="Penalties"
              value={
                <Nullable
                  value={
                    m.score.pen_home === null ? null : `${m.score.pen_home}–${m.score.pen_away}`
                  }
                  reason="No shoot-out."
                />
              }
            />
            <KeyValue label="Total goals" value={int(m.score.total_goals)} />
            <KeyValue label="Both teams scored" value={m.score.btts ? "yes" : "no"} />
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            {m.status_group === "postponed" || m.status_group === "cancelled"
              ? `Not played (${m.status_short}): there is no result to record.`
              : m.awaiting_result
                ? "Kicked off, but no result has been recorded yet."
                : "Scheduled. The result is recorded after full time."}
          </p>
        )}
      </Panel>
      <Panel title="Fixture">
        <KeyValue label="Kick-off" value={utcDateTime(m.kickoff_at)} />
        <KeyValue label="Status" value={`${m.status_short} (${m.status_group})`} />
        <KeyValue label="Competition" value={m.competition.name} />
        <KeyValue label="Season" value={m.competition.season} />
        <KeyValue
          label="Round"
          value={<Nullable value={m.round} reason="The provider did not report a round." />}
        />
        <KeyValue
          label="Venue"
          value={
            <Nullable
              value={d.venue ? `${d.venue.name}${d.venue.city ? `, ${d.venue.city}` : ""}` : null}
              reason="The provider did not identify the venue."
            />
          }
        />
        <KeyValue label="Odds snapshots" value={int(m.odds.snapshots)} />
        <KeyValue label="Bookmakers" value={int(m.odds.bookmakers)} />
        <KeyValue label="Near-close captures" value={int(m.odds.near_close_snapshots)} />
        <KeyValue label="Predictions" value={int(m.predictions)} />
        <div className="mt-3 flex flex-wrap gap-2 text-caption">
          <Link to="/teams" className="text-primary hover:underline">
            Teams
          </Link>
          <Link to="/odds" className="text-primary hover:underline">
            Odds explorer
          </Link>
        </div>
      </Panel>
    </div>
  );
}

function MarketsTab({ d }: { d: MatchDetail }) {
  return (
    <Panel
      title="Markets"
      subtitle="Latest captured price per bookmaker. Implied probability is 1/odds: the bookmaker margin is still in it."
      bodyClassName=""
    >
      <SectionView section={d.markets}>
        {(quotes) => (
          <TableShell>
            <THead>
              <TH>Market</TH>
              <TH>Selection</TH>
              <TH>Bookmaker</TH>
              <TH align="right">Odds</TH>
              <TH align="right">Implied (raw)</TH>
              <TH>Captured</TH>
              <TH>Feed</TH>
            </THead>
            <tbody>
              {quotes.map((qt) => (
                <TRow key={`${qt.bookmaker_id}-${qt.market_key}-${qt.selection}-${qt.line}`}>
                  <TD className="text-xs">
                    {qt.market_key}
                    {Number(qt.line) !== 0 ? ` ${dec(qt.line, 2)}` : ""}
                  </TD>
                  <TD className="text-sm">{qt.selection}</TD>
                  <TD className="text-xs text-muted-foreground">{qt.bookmaker}</TD>
                  <TD align="right">
                    <Numeric>{dec(qt.odds_decimal, 2)}</Numeric>
                  </TD>
                  <TD align="right">
                    <Numeric muted>{decPct(qt.implied_probability)}</Numeric>
                  </TD>
                  <TD>
                    <span className="numeric text-xs">T-{qt.minutes_to_ko} min</span>
                    <div className="text-caption text-subtle-foreground">
                      {utcDateTime(qt.captured_at)}
                    </div>
                  </TD>
                  <TD>
                    <StatusBadge tone={qt.source === "live" ? "brand" : "neutral"}>
                      {qt.source}
                    </StatusBadge>
                  </TD>
                </TRow>
              ))}
            </tbody>
          </TableShell>
        )}
      </SectionView>
    </Panel>
  );
}

function ModelsTab({ d }: { d: MatchDetail }) {
  return (
    <Panel
      title="Model predictions"
      subtitle="Calibrated probabilities with their data cut-off. Probability is not confidence."
      bodyClassName=""
    >
      <SectionView section={d.predictions}>
        {(rows) => (
          <TableShell>
            <THead>
              <TH>Model</TH>
              <TH>Market</TH>
              <TH>Selection</TH>
              <TH align="right">P (calibrated)</TH>
              <TH align="right">Interval</TH>
              <TH>Data cut-off</TH>
            </THead>
            <tbody>
              {rows.map((p) => (
                <TRow
                  key={`${p.model}-${p.model_version}-${p.market_key}-${p.selection}-${p.line}`}
                >
                  <TD className="text-xs">
                    {p.model} {p.model_version}
                  </TD>
                  <TD className="text-xs">{p.market_key}</TD>
                  <TD className="text-sm">{p.selection}</TD>
                  <TD align="right">
                    <Numeric>{decPct(p.p_calibrated)}</Numeric>
                  </TD>
                  <TD align="right">
                    <Numeric muted>
                      {decPct(p.p_lo)} – {decPct(p.p_hi)}
                    </Numeric>
                  </TD>
                  <TD>
                    <Numeric muted>{utcDateTime(p.data_cutoff_ts)}</Numeric>
                  </TD>
                </TRow>
              ))}
            </tbody>
          </TableShell>
        )}
      </SectionView>
    </Panel>
  );
}

function LineageTab({ d }: { d: MatchDetail }) {
  const l = d.lineage;
  const s = d.match.score;
  const steps: AuditStep[] = [
    {
      id: "provider",
      label: `Provider: ${l.provider}`,
      detail: `Fixture ${l.provider_fixture_id} as the provider identifies it.`,
      reference: `fixture ${l.provider_fixture_id}`,
      at: l.first_seen_at,
    },
    {
      id: "payload",
      label: "Raw payload",
      detail: l.recorded
        ? `${l.source_endpoint ?? "?"} ${l.source_params ? JSON.stringify(l.source_params) : ""}, stored gzipped and indexed by its hash.`
        : (l.note ?? "Not recorded."),
      reference: l.recorded ? `sha256 ${shortHash(l.source_payload_hash)}` : "not linked",
      at: l.source_fetched_at,
    },
    {
      id: "run",
      label: "Ingestion run",
      detail: l.source_run_id
        ? `Written by ${l.source_job_type ?? "a run"}; see the job ledger.`
        : "No run linked to this row.",
      reference: l.source_run_id ? `run ${l.source_run_id}` : "—",
      at: l.source_fetched_at,
    },
    {
      id: "row",
      label: "core.fixtures",
      detail:
        "Normalised row. Writes are monotonic on the payload fetch time: an older payload never overwrites a newer one.",
      reference: `updated ${utcDateTime(l.updated_at)}`,
      at: l.updated_at,
    },
  ];
  if (s) {
    steps.push({
      id: "score",
      label: "core.fixture_results",
      detail: s.source_payload_hash
        ? "The score was read from this payload."
        : "Score written before lineage was recorded (revision 0015).",
      reference: s.source_payload_hash
        ? `sha256 ${shortHash(s.source_payload_hash)}`
        : "not linked",
      at: s.source_fetched_at,
    });
  }
  return (
    <Panel title="Lineage" subtitle="From the provider's bytes to the row on screen">
      <AuditTimeline steps={steps} />
    </Panel>
  );
}
