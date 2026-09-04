import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel, WarningBanner, KeyValue } from "@/components/primitives/Panel";
import { StatusBadge } from "@/components/primitives/StatusBadge";
import { ProvenanceChip } from "@/components/primitives/Indicators";

export const Route = createFileRoute("/ai-analyst")({
  head: () => ({
    meta: [
      { title: "AI Analyst — Football Intelligence" },
      {
        name: "description",
        content:
          "Research assistant grounded in the platform's structured data: models, probabilities, prices and provenance.",
      },
      { property: "og:title", content: "AI Analyst — Football Intelligence" },
      {
        property: "og:description",
        content: "Research assistant grounded in structured model and market data.",
      },
    ],
  }),
  component: AIAnalystPage,
});

const suggestions = [
  "Why does this candidate have an edge?",
  "Compare Poisson against the market in the Premier League.",
  "Which models are worst calibrated right now?",
  "Where did our pick line value drop this week?",
  "Show fixtures with strong model-market disagreement.",
];

const tools = [
  ["query_fixtures", "Read normalized fixtures and their coverage state"],
  ["query_predictions", "Read predictions with model and feature versions"],
  ["query_odds_snapshots", "Read captured prices and consensus construction"],
  ["query_model_scores", "Read Brier, log loss and calibration by segment"],
  ["query_data_quality", "Read ingestion completeness and failures"],
];

function AIAnalystPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumb={[{ label: "System" }, { label: "AI Analyst" }]}
        title="AI Analyst"
        description="A research assistant, not a tipster. Every future answer must be grounded in structured platform data and cite the records it used."
        actions={<StatusBadge tone="warning">Not connected</StatusBadge>}
      />

      <WarningBanner>
        The assistant is not wired to a model yet. Once connected, it will only answer from internal
        tools — it will never speculate about outcomes or produce recommendations.
      </WarningBanner>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Research console" className="lg:col-span-2" bodyClassName="">
          <div className="flex min-h-[22rem] flex-col">
            <div className="flex-1 space-y-3 p-4">
              <div className="max-w-lg rounded-lg border border-border bg-elevated/50 p-3">
                <div className="text-label text-subtle-foreground">Assistant</div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  I answer from the platform's own records: fixtures, feature snapshots,
                  predictions, odds snapshots and model scores. If the data does not support an
                  answer, I will say so instead of estimating.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ProvenanceChip label="Grounding" value="internal tools only" />
                  <ProvenanceChip label="Mode" value="research" />
                </div>
              </div>

              <div className="pt-2">
                <div className="text-label text-subtle-foreground">Suggested questions</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground opacity-70"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-border p-3">
              <div className="flex items-center gap-2">
                <input
                  disabled
                  placeholder="Ask about models, markets, coverage or a specific fixture…"
                  className="h-9 flex-1 cursor-not-allowed rounded-md border border-border bg-card px-3 text-sm placeholder:text-subtle-foreground"
                />
                <button
                  type="button"
                  disabled
                  className="h-9 cursor-not-allowed rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground opacity-50"
                >
                  Ask
                </button>
              </div>
              <p className="mt-2 text-caption text-subtle-foreground">
                Disabled until the assistant is connected to the FastAPI tool layer.
              </p>
            </div>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Tools it will call" subtitle="Structured reads, no free-form generation">
            <ul className="space-y-2.5">
              {tools.map(([name, desc]) => (
                <li key={name}>
                  <div className="numeric text-xs text-primary">{name}</div>
                  <div className="text-caption text-muted-foreground">{desc}</div>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Answer contract">
            <KeyValue label="Grounding" value="structured records only" />
            <KeyValue label="Citations" value="required" />
            <KeyValue label="Speculation" value="not permitted" />
            <KeyValue label="Recommendations" value="not permitted" />
            <KeyValue label="Unknown data" value="answers 'not available'" />
          </Panel>
        </div>
      </div>
    </div>
  );
}
