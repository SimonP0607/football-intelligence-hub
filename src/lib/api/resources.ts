/**
 * Resource layer. Each function maps 1:1 to a future FastAPI endpoint.
 * Swap the demo adapter for `httpGet` once the backend is reachable.
 */
import { demo, USING_DEMO_DATA, httpGet } from "./client";
import * as mock from "@/mock/data";
import type {
  CalibrationBin,
  DataQualityStatus,
  Fixture,
  MarketProbability,
  ModelSummary,
  OddsSnapshot,
  PerformanceSummary,
  PickCandidate,
  Prediction,
  SystemHealth,
  TeamRatings,
} from "@/types/domain";

export const api = {
  health: (): Promise<SystemHealth[]> =>
    USING_DEMO_DATA ? demo(mock.systemHealth) : httpGet<SystemHealth[]>("/health"),

  matches: (): Promise<Fixture[]> =>
    USING_DEMO_DATA ? demo(mock.fixtures) : httpGet<Fixture[]>("/matches"),

  match: (id: string): Promise<Fixture | undefined> =>
    USING_DEMO_DATA
      ? demo(mock.fixtures.find((f) => f.id === id))
      : httpGet<Fixture>(`/matches/${id}`),

  matchMarkets: (id: string): Promise<MarketProbability[]> =>
    USING_DEMO_DATA
      ? demo(mock.marketsForFixture(id))
      : httpGet<MarketProbability[]>(`/matches/${id}/markets`),

  matchPrediction: (id: string): Promise<Prediction> =>
    USING_DEMO_DATA
      ? demo(mock.predictionForFixture(id))
      : httpGet<Prediction>(`/matches/${id}/prediction`),

  matchOddsSnapshot: (id: string): Promise<OddsSnapshot> =>
    USING_DEMO_DATA
      ? demo(mock.oddsSnapshot)
      : httpGet<OddsSnapshot>(`/matches/${id}/odds-snapshot`),

  matchRatings: (id: string): Promise<{ home: TeamRatings; away: TeamRatings }> =>
    USING_DEMO_DATA
      ? demo({ home: mock.teamRatings["home"]!, away: mock.teamRatings["away"]! })
      : httpGet(`/matches/${id}/ratings`),

  picks: (): Promise<PickCandidate[]> =>
    USING_DEMO_DATA ? demo(mock.picks) : httpGet<PickCandidate[]>("/picks"),

  models: (): Promise<ModelSummary[]> =>
    USING_DEMO_DATA ? demo(mock.models) : httpGet<ModelSummary[]>("/models"),

  calibration: (modelId: string): Promise<CalibrationBin[]> =>
    USING_DEMO_DATA
      ? demo(mock.calibrationBins)
      : httpGet<CalibrationBin[]>(`/models/${modelId}/calibration`),

  performance: (): Promise<PerformanceSummary> =>
    USING_DEMO_DATA ? demo(mock.performance) : httpGet<PerformanceSummary>("/performance"),

  dataQuality: (): Promise<DataQualityStatus[]> =>
    USING_DEMO_DATA ? demo(mock.dataQuality) : httpGet<DataQualityStatus[]>("/data-quality"),
};

export const queries = {
  health: { queryKey: ["health"], queryFn: api.health },
  matches: { queryKey: ["matches"], queryFn: api.matches },
  picks: { queryKey: ["picks"], queryFn: api.picks },
  models: { queryKey: ["models"], queryFn: api.models },
  performance: { queryKey: ["performance"], queryFn: api.performance },
  dataQuality: { queryKey: ["data-quality"], queryFn: api.dataQuality },
};
