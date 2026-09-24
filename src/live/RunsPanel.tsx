import { Panel } from "@/components/primitives/Panel";
import { TableShell, THead, TH, TRow, TD } from "@/components/primitives/DataTable";
import { Numeric } from "@/components/primitives/Indicators";
import { StatusNotice } from "@/components/system/LiveState";
import type { RunSummary } from "@/lib/api/v1/types";
import { int } from "@/lib/format";
import { durationMs, utcDateTime } from "./format";
import { RunStatusBadge } from "./shared";
import { JOB_LABEL } from "./labels";

export function RunsPanel({ runs }: { runs: RunSummary[] }) {
  return (
    <Panel
      title="Recent ingestion runs"
      subtitle="The job ledger: what the system did, and what it cost"
      bodyClassName=""
    >
      {runs.length === 0 ? (
        <StatusNotice status="empty" reason="No ingestion run has been recorded yet." />
      ) : (
        <TableShell>
          <THead>
            <TH>Job</TH>
            <TH>Status</TH>
            <TH>Started</TH>
            <TH align="right">Duration</TH>
            <TH align="right">Requests</TH>
            <TH align="right">Rows written / updated</TH>
            <TH align="right">Errors</TH>
          </THead>
          <tbody>
            {runs.map((r) => (
              <TRow key={r.id}>
                <TD>
                  <div className="text-sm">{JOB_LABEL[r.job_type] ?? r.job_type}</div>
                  <div className="numeric text-caption text-subtle-foreground">run {r.id}</div>
                </TD>
                <TD>
                  <RunStatusBadge status={r.status} />
                </TD>
                <TD>
                  <Numeric>{utcDateTime(r.started_at)}</Numeric>
                </TD>
                <TD align="right">
                  <Numeric muted>{durationMs(r.duration_ms)}</Numeric>
                </TD>
                <TD align="right">
                  <Numeric>{int(r.api_calls)}</Numeric>
                </TD>
                <TD align="right">
                  <Numeric>
                    {int(r.rows_written)} / {int(r.rows_updated)}
                  </Numeric>
                </TD>
                <TD align="right">
                  <span title={r.last_error ?? undefined}>
                    <Numeric className={r.errors ? "text-warning" : ""}>{int(r.errors)}</Numeric>
                  </span>
                </TD>
              </TRow>
            ))}
          </tbody>
        </TableShell>
      )}
    </Panel>
  );
}
