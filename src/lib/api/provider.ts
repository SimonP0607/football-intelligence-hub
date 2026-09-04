/**
 * Data provider contract.
 *
 * The UI only ever talks to a `DataProvider`. Today the mock provider answers
 * every call; when FastAPI is reachable the http provider takes over and no
 * page, component or hook changes.
 *
 *   UI → DataProvider → MockDataProvider | FastApiDataProvider
 */
import type {
  AnalystAnswer,
  BacktestConfig,
  BacktestResult,
  BookmakerPrice,
  CalibrationBin,
  ConsensusRow,
  CoverageRow,
  DataIssue,
  DataQualityStatus,
  Fixture,
  LineMovementSeries,
  LineageNode,
  MarketProbability,
  ModelComparisonRow,
  ModelSummary,
  NearCloseRow,
  OddsSnapshot,
  PerformanceCharts,
  PerformanceSummary,
  PickCandidate,
  Prediction,
  SearchHit,
  SystemHealth,
  TeamRatings,
  TimelineEvent,
  ValueRow,
} from "@/types/domain";
import * as mock from "@/mock/data";
import * as market from "@/mock/market";
import * as ops from "@/mock/operations";
import * as research from "@/mock/research";
import { demo, httpGet, USING_DEMO_DATA } from "./client";

export interface DataProvider {
  readonly mode: "demo" | "live";

  getHealth(): Promise<SystemHealth[]>;
  getMatches(): Promise<Fixture[]>;
  getMatch(id: string): Promise<Fixture | undefined>;
  getMatchMarkets(id: string): Promise<MarketProbability[]>;
  getMatchPrediction(id: string): Promise<Prediction>;
  getMatchOddsSnapshot(id: string): Promise<OddsSnapshot>;
  getMatchRatings(id: string): Promise<{ home: TeamRatings; away: TeamRatings }>;
  getMatchTimeline(id: string): Promise<TimelineEvent[]>;
  getMatchModelComparison(id: string): Promise<ModelComparisonRow[]>;

  getPicks(): Promise<PickCandidate[]>;
  getModels(): Promise<ModelSummary[]>;
  getCalibration(modelId: string): Promise<CalibrationBin[]>;

  getOddsBoard(fixtureId: string): Promise<BookmakerPrice[]>;
  getOddsConsensus(fixtureId: string): Promise<ConsensusRow[]>;
  getLineMovement(fixtureId: string): Promise<LineMovementSeries[]>;
  getValueScanner(): Promise<ValueRow[]>;
  getNearCloseSnapshots(): Promise<NearCloseRow[]>;

  getPerformance(): Promise<PerformanceSummary>;
  getPerformanceCharts(): Promise<PerformanceCharts>;
  runBacktest(config: BacktestConfig): Promise<BacktestResult>;

  getDataQuality(): Promise<DataQualityStatus[]>;
  getCoverage(): Promise<CoverageRow[]>;
  getDataIssues(): Promise<DataIssue[]>;
  getLineage(): Promise<LineageNode[]>;

  search(term: string): Promise<SearchHit[]>;
  getAnalystAnswers(): Promise<AnalystAnswer[]>;
}

function matchesTerm(hit: SearchHit, term: string): boolean {
  const q = term.trim().toLowerCase();
  if (!q) return false;
  return hit.label.toLowerCase().includes(q) || hit.sublabel.toLowerCase().includes(q);
}

export const mockProvider: DataProvider = {
  mode: "demo",

  getHealth: () => demo(mock.systemHealth),
  getMatches: () => demo(mock.fixtures),
  getMatch: (id) => demo(mock.fixtures.find((f) => f.id === id)),
  getMatchMarkets: (id) => demo(mock.marketsForFixture(id)),
  getMatchPrediction: (id) => demo(mock.predictionForFixture(id)),
  getMatchOddsSnapshot: () => demo(mock.oddsSnapshot),
  getMatchRatings: () =>
    demo({ home: mock.teamRatings["home"]!, away: mock.teamRatings["away"]! }),
  getMatchTimeline: (id) => demo(ops.fixtureTimeline(id)),
  getMatchModelComparison: (id) => demo(research.modelComparison(id)),

  getPicks: () => demo(mock.picks),
  getModels: () => demo(mock.models),
  getCalibration: () => demo(mock.calibrationBins),

  getOddsBoard: (fixtureId) => demo(market.oddsBoard(fixtureId)),
  getOddsConsensus: (fixtureId) => demo(market.consensus(fixtureId)),
  getLineMovement: (fixtureId) => demo(market.lineMovement(fixtureId)),
  getValueScanner: () => demo(market.valueRows),
  getNearCloseSnapshots: () => demo(market.nearCloseRows),

  getPerformance: () => demo(mock.performance),
  getPerformanceCharts: () => demo(research.performanceCharts),
  runBacktest: (config) => demo(research.runBacktest(config), 450),

  getDataQuality: () => demo(mock.dataQuality),
  getCoverage: () => demo(ops.coverage),
  getDataIssues: () => demo(ops.issues),
  getLineage: () => demo(ops.lineage),

  search: (term) => demo(research.searchIndex.filter((h) => matchesTerm(h, term)).slice(0, 12), 40),
  getAnalystAnswers: () => demo(research.analystAnswers),
};

/** Reachable once VITE_API_BASE_URL points at the FastAPI service. */
export const fastApiProvider: DataProvider = {
  mode: "live",

  getHealth: () => httpGet<SystemHealth[]>("/health"),
  getMatches: () => httpGet<Fixture[]>("/matches"),
  getMatch: (id) => httpGet<Fixture>(`/matches/${id}`),
  getMatchMarkets: (id) => httpGet<MarketProbability[]>(`/matches/${id}/markets`),
  getMatchPrediction: (id) => httpGet<Prediction>(`/matches/${id}/prediction`),
  getMatchOddsSnapshot: (id) => httpGet<OddsSnapshot>(`/matches/${id}/odds-snapshot`),
  getMatchRatings: (id) => httpGet<{ home: TeamRatings; away: TeamRatings }>(`/matches/${id}/ratings`),
  getMatchTimeline: (id) => httpGet<TimelineEvent[]>(`/matches/${id}/timeline`),
  getMatchModelComparison: (id) => httpGet<ModelComparisonRow[]>(`/matches/${id}/models`),

  getPicks: () => httpGet<PickCandidate[]>("/picks"),
  getModels: () => httpGet<ModelSummary[]>("/models"),
  getCalibration: (modelId) => httpGet<CalibrationBin[]>(`/models/${modelId}/calibration`),

  getOddsBoard: (fixtureId) => httpGet<BookmakerPrice[]>(`/odds/board?fixture_id=${fixtureId}`),
  getOddsConsensus: (fixtureId) => httpGet<ConsensusRow[]>(`/odds/consensus?fixture_id=${fixtureId}`),
  getLineMovement: (fixtureId) => httpGet<LineMovementSeries[]>(`/odds/movement?fixture_id=${fixtureId}`),
  getValueScanner: () => httpGet<ValueRow[]>("/odds/value-scanner"),
  getNearCloseSnapshots: () => httpGet<NearCloseRow[]>("/odds/near-close"),

  getPerformance: () => httpGet<PerformanceSummary>("/performance"),
  getPerformanceCharts: () => httpGet<PerformanceCharts>("/performance/series"),
  runBacktest: (config) =>
    httpGet<BacktestResult>(`/backtests?${new URLSearchParams({
      model_id: config.modelId,
      model_version: config.modelVersion,
      competition_id: config.competitionId,
      season: config.season,
      market: config.market,
      date_from: config.from,
      date_to: config.to,
      odds_source: config.oddsSource,
      stake_strategy: config.stakeStrategy,
      minimum_edge: String(config.minimumEdge),
    }).toString()}`),

  getDataQuality: () => httpGet<DataQualityStatus[]>("/data-quality"),
  getCoverage: () => httpGet<CoverageRow[]>("/data-quality/coverage"),
  getDataIssues: () => httpGet<DataIssue[]>("/data-quality/issues"),
  getLineage: () => httpGet<LineageNode[]>("/data-quality/lineage"),

  search: (term) => httpGet<SearchHit[]>(`/search?q=${encodeURIComponent(term)}`),
  getAnalystAnswers: () => httpGet<AnalystAnswer[]>("/analyst/answers"),
};

export const dataProvider: DataProvider = USING_DEMO_DATA ? mockProvider : fastApiProvider;
