import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { KeyValue, MetricCard, Panel, WarningBanner } from "@/components/primitives/Panel";
import { TableShell, THead, TH, TRow, TD, TableSkeleton } from "@/components/primitives/DataTable";
import { StatusBadge } from "@/components/primitives/StatusBadge";
import { Numeric } from "@/components/primitives/Indicators";
import { SegmentedTabs } from "@/components/system/Filters";
import { useLiveQuery } from "@/components/system/dataSourcesContext";
import { ApiErrorNotice, Nullable, SectionView, StatusNotice } from "@/components/system/LiveState";
import { live } from "@/lib/api/v1/queries";
import type { MarketQuote, OddsSeries } from "@/lib/api/v1/types";
import { int } from "@/lib/format";
import { dec, decPct, relative, utcDate, utcDateTime } from "./format";
import { FixtureLink, StatusGroupBadge } from "./shared";

/* ------------------------------------------------------------------------ */
/* Odds explorer                                                            */
/* ------------------------------------------------------------------------ */

const oddsTabs = ["Board", "Movement", "Near-close", "Consensus"] as const;
type OddsTab = (typeof oddsTabs)[number];

export function OddsLive() {
  const list = useLiveQuery(live.odds);
  const [selected, setSelected] = useState<number | null>(null);
  const fixtures = list.data?.data ?? [];
  const active = selected ?? fixtures[0]?.id ?? null;

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb={[{ label: "Market" }, { label: "Odds" }]}
        title="Odds"
        description="Every price the capturer has stored, per fixture and bookmaker. Implied probabilities are raw (1/odds); de-vigged probabilities appear only in the consensus."
      />
      <Panel title="Fixtures with captured prices" bodyClassName="">
        {list.isLoading ? (
          <TableSkeleton rows={3} cols={5} />
        ) : list.isError ? (
          <div className="p-4">
            <ApiErrorNotice error={list.error} />
          </div>
        ) : list.data && list.data.status !== "ok" ? (
          <StatusNotice status={list.data.status} reason={list.data.reason} />
        ) : (
          <TableShell>
            <THead>
              <TH>Kick-off</TH>
              <TH>Fixture</TH>
              <TH>Status</TH>
              <TH align="right">Snapshots</TH>
              <TH align="right">Bookmakers</TH>
              <TH align="right">Markets</TH>
              <TH>Last capture</TH>
            </THead>
            <tbody>
              {fixtures.map((m) => (
                <TRow key={m.id} onClick={() => setSelected(m.id)} selected={active === m.id}>
                  <TD>
                    <Numeric>{utcDateTime(m.kickoff_at)}</Numeric>
                  </TD>
                  <TD>
                    <FixtureLink match={m} />
                  </TD>
                  <TD>
                    <StatusGroupBadge match={m} />
                  </TD>
                  <TD align="right">
                    <Numeric>{int(m.odds.snapshots)}</Numeric>
                  </TD>
                  <TD align="right">
                    <Numeric>{int(m.odds.bookmakers)}</Numeric>
                  </TD>
                  <TD align="right">
                    <Numeric>{int(m.odds.markets)}</Numeric>
                  </TD>
                  <TD>
                    <Numeric muted>{relative(m.odds.last_captured_at)}</Numeric>
                  </TD>
                </TRow>
              ))}
            </tbody>
          </TableShell>
        )}
      </Panel>
      {active !== null ? <FixtureOddsPanel id={active} /> : null}
    </div>
  );
}

function bestPrices(quotes: MarketQuote[]) {
  const best = new Map<string, MarketQuote>();
  for (const q of quotes) {
    const k = `${q.market_key}|${q.selection}|${q.line}`;
    const cur = best.get(k);
    if (!cur || Number(q.odds_decimal) > Number(cur.odds_decimal)) best.set(k, q);
  }
  return [...best.values()];
}

function FixtureOddsPanel({ id }: { id: number }) {
  const [tab, setTab] = useState<OddsTab>("Board");
  const q = useLiveQuery(live.fixtureOdds(String(id)));
  const best = useMemo(
    () => (q.data?.data.board.status === "ok" ? bestPrices(q.data.data.board.data) : []),
    [q.data],
  );
  if (q.isLoading)
    return (
      <Panel title="Fixture odds">
        <TableSkeleton rows={5} cols={5} />
      </Panel>
    );
  if (q.isError || !q.data) return <ApiErrorNotice error={q.error} />;
  const d = q.data.data;
  return (
    <div className="space-y-3">
      <SegmentedTabs label="Odds sections" tabs={oddsTabs} value={tab} onChange={setTab} />
      {tab === "Board" ? (
        <Panel
          title={`${d.match.home.name} v ${d.match.away.name}`}
          subtitle="Latest price per bookmaker, and the best available per selection"
          bodyClassName=""
        >
          <SectionView section={d.board}>
            {(quotes) => (
              <>
                <TableShell>
                  <THead>
                    <TH>Market</TH>
                    <TH>Selection</TH>
                    <TH align="right">Best odds</TH>
                    <TH>At</TH>
                    <TH align="right">Implied (raw)</TH>
                  </THead>
                  <tbody>
                    {best.map((b) => (
                      <TRow key={`${b.market_key}-${b.selection}-${b.line}`}>
                        <TD className="text-xs">{b.market_key}</TD>
                        <TD className="text-sm">{b.selection}</TD>
                        <TD align="right">
                          <Numeric>{dec(b.odds_decimal)}</Numeric>
                        </TD>
                        <TD className="text-xs text-muted-foreground">{b.bookmaker}</TD>
                        <TD align="right">
                          <Numeric muted>{decPct(b.implied_probability)}</Numeric>
                        </TD>
                      </TRow>
                    ))}
                  </tbody>
                </TableShell>
                <p className="border-t border-border px-4 py-2 text-caption text-subtle-foreground">
                  {quotes.length} latest quotes from{" "}
                  {new Set(quotes.map((x) => x.bookmaker_id)).size} bookmakers.
                </p>
              </>
            )}
          </SectionView>
        </Panel>
      ) : null}
      {tab === "Movement" ? (
        <Panel
          title="Line movement"
          subtitle="First and last captured price per bookmaker and selection"
          bodyClassName=""
        >
          <SectionView section={d.series}>
            {(series) => <MovementTable series={series} />}
          </SectionView>
        </Panel>
      ) : null}
      {tab === "Near-close" ? (
        <Panel
          title="Near-close"
          subtitle="The capture closest to kick-off our cadence allowed. Not a closing line until validated."
          bodyClassName=""
        >
          <SectionView section={d.near_close}>
            {(rows) => (
              <TableShell>
                <THead>
                  <TH>Bookmaker</TH>
                  <TH>Market</TH>
                  <TH>Selection</TH>
                  <TH align="right">Odds</TH>
                  <TH>Captured</TH>
                  <TH>Validated close</TH>
                </THead>
                <tbody>
                  {rows.map((r) => (
                    <TRow key={`${r.bookmaker}-${r.market_key}-${r.selection}-${r.line}`}>
                      <TD className="text-xs">{r.bookmaker}</TD>
                      <TD className="text-xs">{r.market_key}</TD>
                      <TD className="text-sm">{r.selection}</TD>
                      <TD align="right">
                        <Numeric>{dec(r.odds_decimal)}</Numeric>
                      </TD>
                      <TD>
                        <span className="numeric text-xs">T-{r.minutes_to_ko} min</span>
                      </TD>
                      <TD>
                        {r.is_validated_close ? (
                          <StatusBadge tone="positive">
                            {r.close_validation_method ?? "yes"}
                          </StatusBadge>
                        ) : (
                          <StatusBadge tone="neutral">no</StatusBadge>
                        )}
                      </TD>
                    </TRow>
                  ))}
                </tbody>
              </TableShell>
            )}
          </SectionView>
        </Panel>
      ) : null}
      {tab === "Consensus" ? (
        <Panel
          title="Market consensus"
          subtitle="De-vigged probability across bookmakers"
          bodyClassName=""
        >
          <SectionView section={d.consensus}>
            {(rows) => (
              <TableShell>
                <THead>
                  <TH>Market</TH>
                  <TH>Selection</TH>
                  <TH>Method</TH>
                  <TH align="right">Fair probability</TH>
                  <TH align="right">Overround</TH>
                  <TH align="right">Books</TH>
                </THead>
                <tbody>
                  {rows.map((r) => (
                    <TRow key={`${r.market_key}-${r.selection}-${r.line}-${r.devig_method}`}>
                      <TD className="text-xs">{r.market_key}</TD>
                      <TD className="text-sm">{r.selection}</TD>
                      <TD className="text-xs">{r.devig_method}</TD>
                      <TD align="right">
                        <Numeric>{decPct(r.p_fair)}</Numeric>
                      </TD>
                      <TD align="right">
                        <Numeric muted>{decPct(r.overround, 2)}</Numeric>
                      </TD>
                      <TD align="right">
                        <Numeric>{r.n_bookmakers}</Numeric>
                      </TD>
                    </TRow>
                  ))}
                </tbody>
              </TableShell>
            )}
          </SectionView>
        </Panel>
      ) : null}
    </div>
  );
}

function MovementTable({ series }: { series: OddsSeries[] }) {
  return (
    <TableShell>
      <THead>
        <TH>Bookmaker</TH>
        <TH>Market</TH>
        <TH>Selection</TH>
        <TH align="right">First</TH>
        <TH align="right">Last</TH>
        <TH align="right">Change</TH>
        <TH align="right">Captures</TH>
      </THead>
      <tbody>
        {series.map((s) => {
          const first = s.points[0];
          const last = s.points[s.points.length - 1];
          const change =
            first && last ? Number(last.odds_decimal) - Number(first.odds_decimal) : null;
          return (
            <TRow key={`${s.bookmaker_id}-${s.market_key}-${s.selection}-${s.line}`}>
              <TD className="text-xs">{s.bookmaker}</TD>
              <TD className="text-xs">{s.market_key}</TD>
              <TD className="text-sm">{s.selection}</TD>
              <TD align="right">
                <Numeric>
                  {first ? `${dec(first.odds_decimal)} · T-${first.minutes_to_ko}` : null}
                </Numeric>
              </TD>
              <TD align="right">
                <Numeric>
                  {last ? `${dec(last.odds_decimal)} · T-${last.minutes_to_ko}` : null}
                </Numeric>
              </TD>
              <TD align="right">
                <Numeric
                  className={
                    change === null || change === 0
                      ? ""
                      : change > 0
                        ? "text-positive"
                        : "text-negative"
                  }
                >
                  {change === null ? null : `${change > 0 ? "+" : ""}${change.toFixed(2)}`}
                </Numeric>
              </TD>
              <TD align="right">
                <Numeric>{s.points.length}</Numeric>
              </TD>
            </TRow>
          );
        })}
      </tbody>
    </TableShell>
  );
}

/* ------------------------------------------------------------------------ */
/* Models lab                                                               */
/* ------------------------------------------------------------------------ */

const NO_BACKTEST = "No walk-forward backtest has been run for this version yet.";
const NO_ECONOMIC =
  "Insufficient validated sample: economic metrics need settled picks and historical prices.";

export function ModelsLive() {
  const q = useLiveQuery(live.models);
  const d = q.data?.data;
  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb={[{ label: "Research" }, { label: "Models" }]}
        title="Models"
        description="A model is judged against the market baseline, never by accuracy alone. Predictive quality and betting performance are separate questions."
      />
      {q.isError ? <ApiErrorNotice error={q.error} /> : null}
      <Panel
        title="Market baseline"
        subtitle="De-vigged bookmaker consensus: the reference every model must beat"
      >
        {d ? (
          <SectionView section={d.market_baseline}>
            {(b) =>
              b ? (
                <div className="grid gap-x-6 sm:grid-cols-3">
                  <KeyValue
                    label="Fixtures with consensus"
                    value={int(b.fixtures_with_consensus)}
                  />
                  <KeyValue label="Methods" value={b.methods.join(", ")} />
                  <KeyValue label="Last computed" value={utcDateTime(b.last_as_of)} />
                </div>
              ) : null
            }
          </SectionView>
        ) : (
          <TableSkeleton rows={2} cols={3} />
        )}
      </Panel>
      <Panel
        title="Predictive quality"
        subtitle="Out-of-sample, walk-forward. Lower Brier and log loss are better; ECE is calibration error."
        bodyClassName=""
      >
        {!d ? (
          <TableSkeleton rows={3} cols={6} />
        ) : (
          <SectionView section={d.models}>
            {(models) => (
              <TableShell>
                <THead>
                  <TH>Model</TH>
                  <TH>Version</TH>
                  <TH>Status</TH>
                  <TH>Trained on</TH>
                  <TH align="right">Samples</TH>
                  <TH align="right">Brier</TH>
                  <TH align="right">Log loss</TH>
                  <TH align="right">ECE</TH>
                </THead>
                <tbody>
                  {models.map((m) => (
                    <TRow key={m.version_id}>
                      <TD>
                        <div className="text-sm">{m.name}</div>
                        <div className="text-caption text-subtle-foreground">{m.family}</div>
                      </TD>
                      <TD className="numeric text-xs">{m.version}</TD>
                      <TD>
                        <StatusBadge
                          tone={
                            m.status === "champion"
                              ? "positive"
                              : m.status === "shadow"
                                ? "brand"
                                : "neutral"
                          }
                        >
                          {m.status}
                        </StatusBadge>
                      </TD>
                      <TD className="numeric text-xs">
                        {utcDate(m.train_from)} – {utcDate(m.train_to)} · n={int(m.n_train)}
                      </TD>
                      <TD align="right">
                        <Nullable
                          value={m.latest_backtest ? int(m.latest_backtest.n_samples) : null}
                          reason={NO_BACKTEST}
                          className="numeric"
                        />
                      </TD>
                      <TD align="right">
                        <Nullable
                          value={dec(m.latest_backtest?.brier, 4)}
                          reason={NO_BACKTEST}
                          className="numeric"
                        />
                      </TD>
                      <TD align="right">
                        <Nullable
                          value={dec(m.latest_backtest?.logloss, 4)}
                          reason={NO_BACKTEST}
                          className="numeric"
                        />
                      </TD>
                      <TD align="right">
                        <Nullable
                          value={dec(m.latest_backtest?.ece, 4)}
                          reason={NO_BACKTEST}
                          className="numeric"
                        />
                      </TD>
                    </TRow>
                  ))}
                </tbody>
              </TableShell>
            )}
          </SectionView>
        )}
      </Panel>
      <Panel
        title="Betting performance"
        subtitle="Only from settled picks at recorded prices. Line value is measured against near-close, not a validated close."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {["ROI", "Yield", "Line value", "Drawdown"].map((k) => (
            <div key={k} className="surface-panel px-4 py-3">
              <div className="text-label text-subtle-foreground">{k}</div>
              <div className="mt-1.5 numeric-lg">
                <Nullable value={null} reason={NO_ECONOMIC} />
              </div>
              <div className="mt-1 text-caption text-muted-foreground">
                Insufficient validated sample
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Picks and performance                                                    */
/* ------------------------------------------------------------------------ */

const LIFECYCLE = ["candidate", "shadow", "qualified", "published", "settled", "rejected"] as const;

export function PicksLive() {
  const q = useLiveQuery(live.picks);
  const d = q.data?.data;
  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb={[{ label: "Research" }, { label: "Picks" }]}
        title="Picks"
        description="Candidates move CANDIDATE → SHADOW → QUALIFIED → (PUBLISHED, disabled) → SETTLED, or are REJECTED with a reason. Nothing is published."
      />
      <WarningBanner>
        Publishing is disabled. Every pick the engine produces stays in shadow mode.
      </WarningBanner>
      {q.isError ? <ApiErrorNotice error={q.error} /> : null}
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {LIFECYCLE.map((s) => (
          <MetricCard
            key={s}
            label={s}
            value={
              d
                ? int(
                    s === "rejected"
                      ? (d.candidates_by_decision["rejected"] ?? 0)
                      : s === "candidate"
                        ? (d.candidates_by_decision["selected"] ?? 0)
                        : s === "shadow"
                          ? (d.picks_by_mode["shadow"] ?? 0)
                          : s === "published"
                            ? (d.picks_by_mode["live"] ?? 0)
                            : 0,
                  )
                : null
            }
            tone="muted"
            hint={s === "published" ? "Disabled" : " "}
          />
        ))}
      </div>
      <Panel title="Picks" bodyClassName="">
        {!d ? (
          <TableSkeleton rows={3} cols={6} />
        ) : (
          <SectionView section={d.picks}>
            {(rows) => (
              <TableShell>
                <THead>
                  <TH>Created</TH>
                  <TH>Market</TH>
                  <TH>Selection</TH>
                  <TH align="right">Odds</TH>
                  <TH align="right">Model p</TH>
                  <TH align="right">Market p</TH>
                  <TH align="right">EV</TH>
                  <TH>Status</TH>
                </THead>
                <tbody>
                  {rows.map((p) => (
                    <TRow key={p.id}>
                      <TD>
                        <Numeric>{utcDateTime(p.created_at)}</Numeric>
                      </TD>
                      <TD className="text-xs">{p.market_key}</TD>
                      <TD className="text-sm">{p.selection}</TD>
                      <TD align="right">
                        <Numeric>{dec(p.market_odds)}</Numeric>
                      </TD>
                      <TD align="right">
                        <Numeric>{decPct(p.p_calibrated)}</Numeric>
                      </TD>
                      <TD align="right">
                        <Numeric muted>{decPct(p.p_market_fair)}</Numeric>
                      </TD>
                      <TD align="right">
                        <Numeric>{decPct(p.ev)}</Numeric>
                      </TD>
                      <TD>
                        <StatusBadge tone="brand">{p.status}</StatusBadge>
                      </TD>
                    </TRow>
                  ))}
                </tbody>
              </TableShell>
            )}
          </SectionView>
        )}
      </Panel>
    </div>
  );
}

export function PerformanceLive() {
  const q = useLiveQuery(live.performance);
  const d = q.data?.data;
  const reason = q.data?.reason ?? null;
  const cards: Array<[string, string | null]> = [
    ["P&L (units)", dec(d?.profit_units)],
    ["ROI", d?.roi_pct ? `${dec(d.roi_pct)}%` : null],
    ["Hit rate", d?.hit_rate ? `${dec(d.hit_rate)}%` : null],
    ["Staked (units)", dec(d?.staked_units)],
  ];
  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb={[{ label: "Research" }, { label: "Performance" }]}
        title="Performance"
        description="Economic metrics exist only when there are settled picks at recorded prices. Until then every figure here is withheld, not zero."
      />
      {q.isError ? <ApiErrorNotice error={q.error} /> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="surface-panel px-4 py-3">
            <div className="text-label text-subtle-foreground">{label}</div>
            <div className="mt-1.5 numeric-lg">
              <Nullable value={value} reason={reason ?? "Not computable yet."} />
            </div>
          </div>
        ))}
      </div>
      <Panel title="Sample">
        <KeyValue label="Settled picks" value={int(d?.settled ?? null)} />
        <KeyValue label="Pending picks" value={int(d?.pending ?? null)} />
        {q.data ? (
          <StatusNotice status={q.data.status} reason={q.data.reason} compact className="mt-2" />
        ) : null}
        {d ? <p className="mt-2 text-caption text-subtle-foreground">{d.note}</p> : null}
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Pages the backend does not serve yet                                     */
/* ------------------------------------------------------------------------ */

export function NotYetLive({
  title,
  breadcrumb,
  reason,
}: {
  title: string;
  breadcrumb: string;
  reason: string;
}) {
  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb={[{ label: breadcrumb }, { label: title }]}
        title={title}
        description="Live mode: this page shows only what the API serves."
      />
      <Panel>
        <StatusNotice status="not_available" reason={reason} />
      </Panel>
    </div>
  );
}
