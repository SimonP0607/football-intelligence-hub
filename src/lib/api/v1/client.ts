import { API_BASE_URL } from "@/lib/api/mode";
import type {
  CompetitionDetail,
  CompetitionSummary,
  CoverageRow,
  Envelope,
  FixtureOdds,
  MatchDetail,
  MatchSummary,
  ModelsOverview,
  Overview,
  PerformanceSummary,
  PicksOverview,
  QualityIssue,
  QualityReport,
  RunSummary,
  SearchHit,
  SystemHealth,
  TeamDetail,
  TeamSummary,
} from "./types";

/** An error the API itself reported, or a transport failure. */
export class LiveApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly requestId: string | null,
  ) {
    super(message);
    this.name = "LiveApiError";
  }
}

async function getJson<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const url = new URL(`${API_BASE_URL}/api/v1${path}`);
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  let res: Response;
  try {
    res = await fetch(url, { headers: { accept: "application/json" } });
  } catch {
    throw new LiveApiError(`The API at ${API_BASE_URL} is not reachable.`, 0, "unreachable", null);
  }
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new LiveApiError(`Unexpected response from ${path}.`, res.status, "bad_response", null);
  }
  if (!res.ok) {
    const err = (body ?? {}) as {
      error?: { code?: string; message?: string };
      request_id?: string;
    };
    throw new LiveApiError(
      err.error?.message ?? `GET ${path} failed (${res.status})`,
      res.status,
      err.error?.code ?? "error",
      err.request_id ?? res.headers.get("x-request-id"),
    );
  }
  return body as T;
}

export interface MatchQuery {
  date_from?: string;
  date_to?: string;
  status?: string;
  competition_id?: number;
  team_id?: number;
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export const v1 = {
  health: () => getJson<SystemHealth>("/health"),
  overview: () => getJson<Envelope<Overview>>("/overview"),
  quality: () => getJson<Envelope<QualityReport>>("/health/quality"),
  coverage: () => getJson<Envelope<CoverageRow[]>>("/data-quality/coverage"),
  issues: () => getJson<Envelope<QualityIssue[]>>("/data-quality/issues"),
  runs: (limit = 20) => getJson<Envelope<RunSummary[]>>("/ingestion/runs", { limit }),
  matches: (q: MatchQuery = {}) =>
    getJson<Envelope<MatchSummary[]>>("/matches", q as Record<string, string | number | undefined>),
  match: (id: number | string) => getJson<Envelope<MatchDetail>>(`/matches/${id}`),
  competitions: (tracked?: boolean) =>
    getJson<Envelope<CompetitionSummary[]>>("/competitions", {
      tracked: tracked === undefined ? undefined : String(tracked),
      limit: 200,
    }),
  competition: (id: number | string) => getJson<Envelope<CompetitionDetail>>(`/competitions/${id}`),
  teams: (competitionId?: number) =>
    getJson<Envelope<TeamSummary[]>>("/teams", { competition_id: competitionId, limit: 200 }),
  team: (id: number | string) => getJson<Envelope<TeamDetail>>(`/teams/${id}`),
  odds: () => getJson<Envelope<MatchSummary[]>>("/odds"),
  fixtureOdds: (id: number | string, market?: string) =>
    getJson<Envelope<FixtureOdds>>(`/odds/fixtures/${id}`, { market }),
  models: () => getJson<Envelope<ModelsOverview>>("/models"),
  picks: () => getJson<Envelope<PicksOverview>>("/picks"),
  performance: () => getJson<Envelope<PerformanceSummary>>("/performance"),
  search: (q: string) => getJson<Envelope<SearchHit[]>>("/search", { q, limit: 8 }),
};
