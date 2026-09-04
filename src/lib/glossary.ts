/**
 * Single source of truth for quantitative terminology shown in the UI.
 * Never mix these definitions: model probability, market probability and
 * confidence are different objects.
 */
export const glossary = {
  modelProbability:
    "Probability produced by a statistical model from its feature snapshot. It is not a confidence level and it is not derived from prices.",
  marketProbability:
    "Consensus probability across tracked bookmakers after removing the overround. It is not the raw implied probability of a single price.",
  impliedProbability:
    "Raw 1 / odds of a single bookmaker price. It still contains the bookmaker margin, so it always sums above 100% across a market.",
  fairOdds:
    "Price that would make a selection break even at the model probability: 1 / model probability. It is not an available price.",
  bestOdds: "Highest price currently captured for the selection across tracked bookmakers.",
  edge: "Model probability minus market probability, in percentage points. Requires both a model probability and an available price to exist.",
  ev: "Expected value: model probability multiplied by the available price, minus one. It is an arithmetic property of the inputs, not a profitability claim.",
  brier: "Mean squared error between predicted probabilities and outcomes. Lower is better; 0.25 is the naive baseline for a coin flip.",
  logLoss:
    "Negative log likelihood of the observed outcomes under the predicted distribution. Punishes confident mistakes harshly. Lower is better.",
  calibration:
    "Agreement between predicted probability and observed frequency. A perfectly calibrated model lies on the diagonal of the reliability curve.",
  calibrationError: "Mean absolute gap between predicted probability and observed frequency across deciles.",
  nearClose:
    "Price captured close to kickoff (T-12m). It is not validated as an official closing price and must not be reported as closing line value.",
  pickLineValue:
    "Difference between the price recorded on a pick and a later reference price. Requires validated near-close capture before it can be reported.",
  overround: "Sum of raw implied probabilities across a market. Values above 1 represent the bookmaker margin.",
  reliability:
    "Qualitative assessment of how much weight the sample, coverage and model status justify. It is not a probability.",
  freshness: "Age of the most recent successful capture relative to the freshness thresholds.",
  sampleSize: "Number of scored observations behind a metric. Small samples cannot separate skill from noise.",
  drawdown: "Largest peak-to-trough decline of a cumulative series.",
  yieldMetric: "Profit divided by total amount staked. Requires settled, published picks.",
  roi: "Return on investment across settled picks. Not computable without validated results.",
} as const;

export type GlossaryKey = keyof typeof glossary;
