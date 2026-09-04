import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/performance")({
  head: () => ({
    meta: [
      { title: "Performance — Football Intelligence" },
      { name: "description", content: "Realised results of published picks. Nothing is published yet, so every metric reads as unavailable." },
      { property: "og:title", content: "Performance — Football Intelligence" },
      { property: "og:description", content: "Realised results of published picks. Nothing is published yet, so every metric reads as unavailable." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ModulePlaceholder
      breadcrumb={[{ label: "Operations" }, { label: "Performance" }]}
      title="Performance"
      description="Realised results of published picks. Nothing is published yet, so every metric reads as unavailable."
      purpose="Performance reports only on settled, published picks. While the platform runs in shadow mode there is no published sample, so P&L, ROI, yield, hit rate, drawdown and line value stay empty by design rather than being back-filled with demo results."
      sections={[{ title: "P&L and bankroll", description: "Equity curve and bankroll evolution over settled picks.", state: "blocked" }, { title: "ROI / Yield", description: "Return per stake and per turnover, segmented by market and competition.", state: "blocked" }, { title: "Pick line value", description: "Price obtained versus near-close reference, once capture is validated.", state: "blocked" }, { title: "Hit rate and drawdown", description: "Outcome frequency and worst peak-to-trough sequence.", state: "blocked" }, { title: "Sample sufficiency", description: "Explicit gating: no conclusion is shown below the minimum sample.", state: "in-progress" }]}
      dataNeeds={["GET /performance", "GET /performance/equity", "GET /performance/segments", "GET /picks?status=settled"]}
    />
  );
}
