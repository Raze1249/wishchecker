import type { DimensionKey } from "./config";

export type Severity = "positive" | "warning" | "unknown";
export type ConfidenceLevel = "High" | "Medium" | "Low" | "Insufficient Data";
export type RiskLevel =
  | "Low Risk"
  | "Moderate Risk"
  | "Elevated Risk"
  | "High Risk"
  | "Insufficient Information";

export interface EngineSignal {
  category: DimensionKey;
  key: string;
  label: string;
  value?: string;
  severity: Severity;
  confidence: ConfidenceLevel;
  source: string;
  explanation: string;
  evidence?: Record<string, unknown>;
}

export interface DimensionResult {
  key: DimensionKey;
  label: string;
  level: RiskLevel;
  score: number; // 0-100 (higher = more risk)
  positives: number;
  warnings: number;
  unknowns: number;
}

export interface ReportStats {
  total: number;
  deliveryPositivePct: number | null;
  productAccuracyPct: number | null;
  conditionPositivePct: number | null;
  refundPositivePct: number | null;
  supportPositivePct: number | null;
  commonIssues: string[];
}

export interface TrustResult {
  riskLevel: RiskLevel;
  confidenceLevel: ConfidenceLevel;
  score: number | null;
  positiveCount: number;
  warningCount: number;
  unknownCount: number;
  signals: EngineSignal[];
  dimensions: DimensionResult[];
  summary: string;
}
