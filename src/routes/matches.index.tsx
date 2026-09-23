import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, SearchX, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel, EmptyState } from "@/components/primitives/Panel";
import {
  TableShell,
  THead,
  TH,
  SortableTH,
  TRow,
  TD,
  TableSkeleton,
  CardRow,
} from "@/components/primitives/DataTable";
import { DataStateBadge, ModelBadge } from "@/components/primitives/StatusBadge";
import { CompetitionBadge, Numeric, TeamBadge } from "@/components/primitives/Indicators";
import { DataModeBadge } from "@/components/system/DataMode";
import { FreshnessBadge, freshnessFromState } from "@/components/system/Freshness";
import { MetricLabel } from "@/components/system/InfoTip";
import {
  FilterBar,
  SearchFilter,
  SegmentedTabs,
  SelectFilter,
  ToggleFilter,
} from "@/components/system/Filters";
import { DateNav, formatDay } from "@/components/football/DateNav";
import { queries } from "@/lib/api/resources";
import { competitions } from "@/mock/data";
import { pct, timeOf } from "@/lib/format";
import { useSortable } from "@/hooks/useSortable";
import type { Fixture } from "@/types/domain";

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

const TODAY = "2026-09-04";
const tabs = ["All", "Upcoming", "Live", "Finished"] as const;
type Tab = (typeof tabs)[number];

type SortKey = "kickoff" | "competition" | "fixture" | "coverage" | "books";

function MatchesPage() {
  const navigate = useNavigate();
  const matches = useQuery(queries.matches);

  const [day, setDay] = useState(TODAY);
  const [tab, setTab] = useState<Tab>("All");
  const [competition, setCompetition] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [term, setTerm] = useState("");
  const [oddsOnly, setOddsOnly] = useState(false);

  // `?? []` built a fresh array on every render, so every useMemo below it
  // re-ran every render and memoised nothing. Memoising the fallback fixes it.
  const all = useMemo(() => matches.data ?? [], [matches.data]);
  const sameDay = useMemo(() => all.filter((f) => f.kickoff.slice(0, 10) === day), [all, day]);

  const counts = useMemo(
    () => ({
      All: sameDay.length,
      Upcoming: sameDay.filter((f) => f.status === "upcoming").length,
      Live: sameDay.filter((f) => f.status === "live").length,
      Finished: sameDay.filter((f) => f.status === "finished").length,
    }),
    [sameDay],
  );

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    return sameDay.filter((f) => {
      if (tab !== "All" && f.status !== tab.toLowerCase()) return false;
      if (competition !== "all" && f.competition.id !== competition) return false;
      if (modelFilter === "available" && f.modelStatus === "insufficient_data") return false;
      if (modelFilter === "missing" && f.modelStatus !== "insufficient_data") return false;
      if (oddsOnly && (f.oddsState === "stale" || f.oddsState === "failed")) return false;
      if (
        q &&
        !`${f.home.name} ${f.away.name} ${f.competition.name} ${f.round}`.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [sameDay, tab, competition, modelFilter, oddsOnly, term]);

  const { sorted, sort, toggle } = useSortable<Fixture, SortKey>(
    filtered,
    {
      kickoff: (f) => f.kickoff,
      competition: (f) => f.competition.name,
      fixture: (f) => f.home.name,
      coverage: (f) => f.marketCoverage,
      books: (f) => f.bookmakerCount,
    },
    { key: "kickoff", direction: "asc" },
  );

  const stale = sameDay.filter((f) => f.oddsState === "stale" || f.dataQuality === "stale").length;

  function reset() {
    setTab("All");
    setCompetition("all");
    setModelFilter("all");
    setOddsOnly(false);
    setTerm("");
  }

  const open = (id: string) => navigate({ to: "/matches/$fixtureId", params: { fixtureId: id } });

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb={[{ label: "Operations" }, { label: "Matches" }]}
        title="Matches"
        description="Every fixture the ingestion layer tracks, with the state of its model output, prices and data quality."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateNav value={day} today={TODAY} onChange={setDay} />
        <span className="numeric text-caption text-subtle-foreground">{formatDay(day)}</span>
      </div>

      <SegmentedTabs
        tabs={tabs}
        value={tab}
        onChange={setTab}
        counts={counts}
        label="Fixture status"
      />

      <FilterBar
        onReset={reset}
        meta={
          <span className="numeric text-caption text-subtle-foreground">
            {sorted.length} / {sameDay.length} fixtures
          </span>
        }
      >
        <SearchFilter
          value={term}
          onChange={setTerm}
          placeholder="Team, competition, round"
          className="w-full sm:w-56"
        />
        <SelectFilter
          label="Competition"
          value={competition}
          onChange={setCompetition}
          options={[
            { value: "all", label: "All competitions" },
            ...competitions.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <SelectFilter
          label="Model"
          value={modelFilter}
          onChange={setModelFilter}
          options={[
            { value: "all", label: "Any status" },
            { value: "available", label: "Model available" },
            { value: "missing", label: "Insufficient data" },
          ]}
        />
        <ToggleFilter label="Usable odds only" checked={oddsOnly} onChange={setOddsOnly} />
      </FilterBar>

      {stale > 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning-soft px-3 py-2 text-xs">
          <TriangleAlert aria-hidden className="h-3.5 w-3.5 shrink-0 text-warning" />
          <span className="text-foreground/85">
            {stale} fixture{stale > 1 ? "s" : ""} on this date have stale captures. Edge values on
            those rows are not decision-grade.
          </span>
        </div>
      ) : null}

      <Panel bodyClassName="">
        {matches.isLoading ? (
          <TableSkeleton rows={8} cols={9} />
        ) : matches.isError ? (
          <EmptyState
            title="Fixtures could not be loaded"
            description="The data provider returned an error. Retry once the service responds."
            icon={<TriangleAlert className="h-5 w-5" />}
            action={
              <button
                type="button"
                onClick={() => void matches.refetch()}
                className="rounded border border-border px-3 py-1.5 text-xs hover:border-border-strong focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                Retry
              </button>
            }
          />
        ) : sorted.length === 0 ? (
          <EmptyState
            title={
              tab === "Live"
                ? "Live coverage is not implemented"
                : "No fixtures match these filters"
            }
            description={
              tab === "Live"
                ? "The ingestion layer only produces pre-match snapshots at this stage, so live fixtures are never populated."
                : "Adjust the date, competition or model filters to widen the selection."
            }
            icon={<SearchX className="h-5 w-5" />}
            action={
              <button
                type="button"
                onClick={reset}
                className="rounded border border-border px-3 py-1.5 text-xs hover:border-border-strong focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                Reset filters
              </button>
            }
          />
        ) : (
          <>
            <div className="hidden lg:block">
              <TableShell>
                <THead>
                  <SortableTH
                    active={sort.key === "kickoff"}
                    direction={sort.direction}
                    onClick={() => toggle("kickoff")}
                  >
                    Time
                  </SortableTH>
                  <SortableTH
                    active={sort.key === "competition"}
                    direction={sort.direction}
                    onClick={() => toggle("competition")}
                  >
                    Competition
                  </SortableTH>
                  <SortableTH
                    active={sort.key === "fixture"}
                    direction={sort.direction}
                    onClick={() => toggle("fixture")}
                  >
                    Fixture
                  </SortableTH>
                  <TH>Status</TH>
                  <TH>Model</TH>
                  <TH>Odds</TH>
                  <SortableTH
                    align="right"
                    active={sort.key === "coverage"}
                    direction={sort.direction}
                    onClick={() => toggle("coverage")}
                  >
                    Markets
                  </SortableTH>
                  <TH>
                    <MetricLabel term="freshness">Data quality</MetricLabel>
                  </TH>
                  <TH align="right">Actions</TH>
                </THead>
                <tbody>
                  {sorted.map((f) => (
                    <TRow key={f.id} onClick={() => open(f.id)}>
                      <TD>
                        <Numeric>{timeOf(f.kickoff)}</Numeric>
                        <div className="text-caption text-subtle-foreground">UTC</div>
                      </TD>
                      <TD>
                        <CompetitionBadge
                          code={f.competition.shortCode}
                          name={f.competition.name}
                        />
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
                        <FreshnessBadge freshness={freshnessFromState(f.dataQuality)} />
                      </TD>
                      <TD align="right">
                        <span className="inline-flex items-center gap-0.5 text-caption text-primary">
                          Match centre
                          <ChevronRight aria-hidden className="h-3 w-3" />
                        </span>
                      </TD>
                    </TRow>
                  ))}
                </tbody>
              </TableShell>
            </div>

            <div className="lg:hidden">
              {sorted.map((f) => (
                <CardRow
                  key={f.id}
                  onClick={() => open(f.id)}
                  title={`${f.home.name} vs ${f.away.name}`}
                  subtitle={`${timeOf(f.kickoff)} UTC · ${f.competition.name} · ${f.round}`}
                  badges={
                    <>
                      <ModelBadge status={f.modelStatus} />
                      <FreshnessBadge freshness={freshnessFromState(f.dataQuality)} />
                    </>
                  }
                  fields={[
                    { label: "Status", value: f.status },
                    { label: "Odds", value: <DataStateBadge state={f.oddsState} /> },
                    { label: "Markets", value: pct(f.marketCoverage, 0) },
                    { label: "Books", value: f.bookmakerCount },
                  ]}
                />
              ))}
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
