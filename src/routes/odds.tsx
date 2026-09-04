import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/odds")({
  head: () => ({
    meta: [
      { title: "Odds Intelligence — Football Intelligence" },
      { name: "description", content: "Price capture, consensus construction and market movement across tracked bookmakers." },
      { property: "og:title", content: "Odds Intelligence — Football Intelligence" },
      { property: "og:description", content: "Price capture, consensus construction and market movement across tracked bookmakers." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ModulePlaceholder
      breadcrumb={[{ label: "Operations" }, { label: "Odds Intelligence" }]}
      title="Odds Intelligence"
      description="Price capture, consensus construction and market movement across tracked bookmakers."
      purpose="Odds Intelligence turns raw bookmaker prices into a comparable market view: overround removal, consensus probability, dispersion between books and movement between snapshots. It is the market side of every edge calculation, and it never asserts a closing line until near-close capture is validated."
      sections={[{ title: "Odds Explorer", description: "Every tracked price per fixture, market and selection with capture timestamps.", state: "in-progress" }, { title: "Market Consensus", description: "Overround-removed consensus probability plus dispersion across books.", state: "planned" }, { title: "Line Movement", description: "Price path between snapshots, not a validated closing line.", state: "planned" }, { title: "Value Scanner", description: "Cross-market sweep for gaps between model and consensus.", state: "planned" }, { title: "Near-Close Snapshots", description: "T-12m captures, labelled as near-close until validation supports line-value claims.", state: "blocked" }]}
      dataNeeds={["GET /odds?fixture_id=", "GET /odds/consensus", "GET /odds/snapshots", "GET /odds/movement"]}
    />
  );
}
