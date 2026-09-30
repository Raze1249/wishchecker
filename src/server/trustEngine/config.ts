// Trust Engine configuration.
//
// Weights are DOCUMENTED and configurable rather than hidden magic numbers.
// The engine never produces a single opaque score as the primary output;
// the score is secondary to the evidence and the per-dimension breakdown.

export const RISK_DIMENSIONS = {
  seller: "Seller Risk",
  website: "Website Risk",
  purchase: "Purchase Risk",
  reputation: "Reputation",
  confidence: "Information Confidence",
} as const;

export type DimensionKey = keyof typeof RISK_DIMENSIONS;

// Severity weighting applied when rolling signals up into a dimension score.
// Higher magnitude = stronger influence on the dimension (0..1 scale internally).
export const SIGNAL_WEIGHTS = {
  positive: 1,
  warning: 1.4, // warnings are weighted slightly higher than positives
  unknown: 0, // unknowns never push risk up; they lower confidence instead
};

// Thresholds that map a normalized 0-100 risk score to a human label.
// Note: "Insufficient Information" is chosen separately when evidence is thin,
// regardless of score — no-evidence must NOT become "high risk".
export const RISK_THRESHOLDS = [
  { max: 20, label: "Low Risk" },
  { max: 45, label: "Moderate Risk" },
  { max: 70, label: "Elevated Risk" },
  { max: 100, label: "High Risk" },
] as const;

// Minimum evidence required before we are willing to state a confident risk.
export const CONFIDENCE_RULES = {
  minSignalsForMedium: 5,
  minSignalsForHigh: 9,
  minReportsForReputationHigh: 25,
};
