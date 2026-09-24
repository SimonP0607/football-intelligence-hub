/**
 * Prices from the second source (Football-Data.co.uk), shown apart from what
 * the platform captured and in the source's own words: "closing" and
 * "pre-closing" are its labels, and neither carries a timestamp.
 */
import { TableShell, THead, TH, TRow, TD } from "@/components/primitives/DataTable";
import { StatusBadge } from "@/components/primitives/StatusBadge";
import { Numeric } from "@/components/primitives/Indicators";
import { InfoTip, MetricLabel } from "@/components/system/InfoTip";
import { Nullable } from "@/components/system/LiveState";
import type { HistoricalBook, HistoricalFair, HistoricalMarket } from "@/lib/api/v1/types";
import { dec, decPct } from "./format";
import { bookLabel } from "./labels";

const BOOK_ORDER = ["pinnacle", "betfair_exchange", "bet365", "williamhill", "bwin", "AVG", "MAX"];
function rank(b: HistoricalBook): number {
  const i = BOOK_ORDER.indexOf(b.bookmaker_code);
  return (i === -1 ? 50 : i) * 2 + (b.price_kind === "closing" ? 0 : 1);
}

function price(b: HistoricalBook, selection: string) {
  return b.prices.find((p) => p.selection === selection) ?? null;
}

function kindLabel(kind: string): string {
  return kind === "pre_closing" ? "pre-closing" : kind;
}

export function HistoricalMarketTables({ market }: { market: HistoricalMarket }) {
  const x12 = market.books.filter((b) => b.market_key === "1X2").sort((a, b) => rank(a) - rank(b));
  const ou = market.books
    .filter((b) => b.market_key === "OU" && Number(b.line) === 2.5)
    .sort((a, b) => rank(a) - rank(b));
  const shin = new Map<string, HistoricalFair>(
    market.fair_1x2
      .filter((f) => f.devig_method === "shin")
      .map((f) => [`${f.bookmaker_code}/${f.price_kind}`, f]),
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 px-4 pt-3 text-caption text-muted-foreground">
        <StatusBadge tone="info">Second source</StatusBadge>
        <InfoTip term="historicalClosing" className="text-caption">
          <span>{market.source}</span>
        </InfoTip>
      </div>
      <p className="px-4 text-caption text-muted-foreground">{market.note}</p>
      <TableShell>
        <THead>
          <TH>Book</TH>
          <TH>Kind</TH>
          <TH align="right">Home</TH>
          <TH align="right">Draw</TH>
          <TH align="right">Away</TH>
          <TH align="right">
            <MetricLabel term="overround">Overround</MetricLabel>
          </TH>
          <TH align="right">
            <MetricLabel term="marketProbability">Fair H / D / A (Shin)</MetricLabel>
          </TH>
        </THead>
        <tbody>
          {x12.map((b) => {
            const f = shin.get(`${b.bookmaker_code}/${b.price_kind}`);
            return (
              <TRow key={`${b.bookmaker_code}-${b.price_kind}`}>
                <TD>
                  <div className="flex items-center gap-2 text-sm">
                    {bookLabel(b.bookmaker_code)}
                    {b.is_composite ? <StatusBadge tone="neutral">composite</StatusBadge> : null}
                  </div>
                </TD>
                <TD className="text-xs text-muted-foreground">{kindLabel(b.price_kind)}</TD>
                {(["Home", "Draw", "Away"] as const).map((sel) => {
                  const p = price(b, sel);
                  return (
                    <TD key={sel} align="right">
                      <Nullable
                        value={p ? dec(p.odds_decimal, 2) : null}
                        reason="The source has no price for this selection."
                        className="numeric"
                      />
                    </TD>
                  );
                })}
                <TD align="right">
                  <Nullable
                    value={dec(b.overround, 3)}
                    reason="A best-price composite is not a book: its prices were never offered together."
                    className="numeric"
                  />
                </TD>
                <TD align="right">
                  <Nullable
                    value={
                      f ? `${decPct(f.p_home)} / ${decPct(f.p_draw)} / ${decPct(f.p_away)}` : null
                    }
                    reason={
                      b.bookmaker_code === "MAX"
                        ? "Not de-vigged: a composite of best prices has no margin to remove."
                        : "No de-vigged baseline was computed for this book."
                    }
                    className="numeric"
                  />
                </TD>
              </TRow>
            );
          })}
        </tbody>
      </TableShell>
      {ou.length ? (
        <TableShell>
          <THead>
            <TH>Over/Under 2.5</TH>
            <TH>Kind</TH>
            <TH align="right">Over</TH>
            <TH align="right">Under</TH>
            <TH align="right">
              <MetricLabel term="overround">Overround</MetricLabel>
            </TH>
          </THead>
          <tbody>
            {ou.map((b) => (
              <TRow key={`ou-${b.bookmaker_code}-${b.price_kind}`}>
                <TD className="text-sm">{bookLabel(b.bookmaker_code)}</TD>
                <TD className="text-xs text-muted-foreground">{kindLabel(b.price_kind)}</TD>
                {(["Over", "Under"] as const).map((sel) => (
                  <TD key={sel} align="right">
                    <Numeric>{dec(price(b, sel)?.odds_decimal, 2)}</Numeric>
                  </TD>
                ))}
                <TD align="right">
                  <Nullable
                    value={dec(b.overround, 3)}
                    reason="A best-price composite is not a book."
                    className="numeric"
                  />
                </TD>
              </TRow>
            ))}
          </tbody>
        </TableShell>
      ) : null}
    </div>
  );
}
