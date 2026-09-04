import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/backtesting")({
  head: () => ({
    meta: [
      { title: "Backtesting — Football Intelligence" },
      { name: "description", content: "Point-in-time replay of models against historical fixtures and archived prices." },
      { property: "og:title", content: "Backtesting — Football Intelligence" },
      { property: "og:description", content: "Point-in-time replay of models against historical fixtures and archived prices." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ModulePlaceholder
      breadcrumb={[{ label: "Intelligence" }, { label: "Backtesting" }]}
      title="Backtesting"
      description="Point-in-time replay of models against historical fixtures and archived prices."
      purpose="Backtesting replays a model version over historical fixtures using only the features available before each kickoff. Runs are versioned and reproducible: same code SHA, same feature version, same data cutoff produce the same result, otherwise the run is invalid."
      sections={[{ title: "Run configuration", description: "Model version, feature version, date range, competitions and markets.", state: "planned" }, { title: "Leakage checks", description: "Assertions that no feature postdates the fixture cutoff.", state: "planned" }, { title: "Scoring", description: "Brier, log loss and calibration error against the market baseline.", state: "planned" }, { title: "Run registry", description: "Immutable history of runs with git SHA and dataset hash.", state: "planned" }]}
      dataNeeds={["POST /backtests", "GET /backtests", "GET /backtests/:id", "GET /backtests/:id/scores"]}
    />
  );
}
