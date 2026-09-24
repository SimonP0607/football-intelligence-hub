/** Human names for job types recorded in the ledger. */
export const JOB_LABEL: Record<string, string> = {
  odds_capture: "Odds capture",
  fixtures_sync: "Fixtures sync",
  results_sync: "Results sync",
  raw_replay: "Raw replay",
  seasons_refresh: "Seasons refresh",
  historical_backfill: "Historical backfill",
  feature_build: "Feature build",
  historical_odds_import: "Historical odds import",
  backtest: "Backtest",
};

/** "pinnacle/closing/shin" -> "Pinnacle · closing · shin". */
export function baselineLabel(key: string): string {
  const [bm, kind, method] = key.split("/");
  const book = bm === "AVG" ? "Market average" : bm === "MAX" ? "Best price" : titleCase(bm ?? key);
  const when =
    kind === "pre_closing" ? "pre-closing" : kind === "closing" ? "closing" : (kind ?? "");
  return `${book} · ${when}${method ? ` · ${method}` : ""}`;
}

function titleCase(s: string): string {
  return s.length ? s[0]!.toUpperCase() + s.slice(1) : s;
}

/** 2024 -> "2024/25", the way API-Football labels a season. */
export function seasonLabel(season: number | null | undefined): string {
  if (season === null || season === undefined) return "—";
  return `${season}/${String((season + 1) % 100).padStart(2, "0")}`;
}
