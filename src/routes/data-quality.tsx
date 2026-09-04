import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel, MetricCard, WarningBanner } from "@/components/primitives/Panel";
import { TableShell, THead, TH, TRow, TD, TableSkeleton } from "@/components/primitives/DataTable";
import { DataStateBadge, StatusBadge } from "@/components/primitives/StatusBadge";
import { Numeric } from "@/components/primitives/Indicators";
import { queries } from "@/lib/api/resources";

export const Route = createFileRoute("/data-quality")({
  head: () => ({
    meta: [
      { title: "Data Quality — Football Intelligence" },
      {
        name: "description",
        content:
          "Ingestion completeness, odds coverage, stale captures, provider errors and entity mapping gaps.",
      },
      { property: "og:title", content: "Data Quality — Football Intelligence" },
      {
        property: "og:description",
        content: "Ingestion completeness and coverage monitoring for the football data pipeline.",
      },
    ],
  }),
  component: DataQualityPage,
});

function DataQualityPage() {
  const dq = useQuery(queries.dataQuality);
  const health = useQuery(queries.health);

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumb={[{ label: "System" }, { label: "Data Quality" }]}
        title="Data Quality"
        description="If ingestion is incomplete or stale, every downstream probability is suspect. This module is a gate, not a report."
        actions={<StatusBadge tone="warning">Demo data</StatusBadge>}
      />

      <WarningBanner>
        1 failed job and 3 stale captures detected in the current window. Candidates derived from
        the affected fixtures are flagged rather than hidden.
      </WarningBanner>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Expected fixtures" value="48" hint="From competition calendars" />
        <MetricCard label="Available fixtures" value="46" tone="warning" hint="2 missing" />
        <MetricCard label="Fixtures with odds" value="41" tone="warning" hint="5 unpriced" />
        <MetricCard
          label="Last successful ingestion"
          value="12:03"
          hint="UTC · fixtures + odds"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Quality checks" className="xl:col-span-2" bodyClassName="">
          {dq.isLoading ? (
            <TableSkeleton rows={10} cols={4} />
          ) : (
            <TableShell>
              <THead>
                <TH>Check</TH>
                <TH align="right">Value</TH>
                <TH>State</TH>
                <TH>Detail</TH>
              </THead>
              <tbody>
                {(dq.data ?? []).map((d) => (
                  <TRow key={d.key}>
                    <TD className="text-sm">{d.label}</TD>
                    <TD align="right">
                      <Numeric>{d.value}</Numeric>
                    </TD>
                    <TD>
                      <DataStateBadge state={d.state} />
                    </TD>
                    <TD className="text-xs text-muted-foreground">{d.detail}</TD>
                  </TRow>
                ))}
              </tbody>
            </TableShell>
          )}
        </Panel>

        <Panel title="Pipeline components">
          <ul className="space-y-2.5">
            {(health.data ?? []).map((h) => (
              <li key={h.component} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm">{h.component}</div>
                  <div className="text-caption text-subtle-foreground">{h.detail}</div>
                </div>
                <DataStateBadge state={h.state} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
