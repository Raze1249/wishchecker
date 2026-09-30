// Trust Engine — turns raw observations into an explainable trust result.
//
// Design principles enforced here:
//  * Evidence over labels — each signal carries source + explanation.
//  * No-evidence != bad — thin evidence yields "Insufficient Information",
//    never automatic high risk.
//  * Confidence is first-class and depends on evidence volume/quality/agreement.
//  * The numeric score is SECONDARY and always accompanied by dimensions.

import { RISK_DIMENSIONS, SIGNAL_WEIGHTS, RISK_THRESHOLDS, CONFIDENCE_RULES, type DimensionKey } from "./config";
import type {
  EngineSignal,
  DimensionResult,
  TrustResult,
  ReportStats,
  RiskLevel,
  ConfidenceLevel,
} from "./types";
import type { WebsiteAnalysis } from "@/server/analyzer/websiteAnalyzer";
import type { ParsedSource } from "@/server/analyzer/inputParser";

export interface EngineInput {
  source: ParsedSource;
  website?: WebsiteAnalysis | null;
  reportStats: ReportStats;
  identityConfidence: ConfidenceLevel;
  hasBusinessInfo: boolean;
}

function pct(n: number | null): string {
  return n === null ? "unknown" : `${n}% positive`;
}

// Build the raw signal list from all inputs.
export function buildSignals(input: EngineInput): EngineSignal[] {
  const signals: EngineSignal[] = [];
  const { website, reportStats, source, identityConfidence, hasBusinessInfo } = input;

  // ---- Website signals ----
  if (website) {
    if (!website.reachable) {
      signals.push({
        category: "website",
        key: "reachable",
        label: "Website reachability",
        severity: "unknown",
        confidence: "Medium",
        source: "TrustGraph website analyzer",
        explanation: website.error ?? "The website could not be reached at analysis time, so website signals are unavailable.",
      });
    } else {
      for (const f of website.findings) {
        let severity: EngineSignal["severity"];
        if (f.present === null) severity = "unknown";
        else if (f.present) severity = "positive";
        else severity = f.key === "domain_age" ? "unknown" : "warning";

        // domain_age is intentionally always unknown (honest)
        if (f.key === "domain_age") severity = "unknown";

        signals.push({
          category: "website",
          key: f.key,
          label: f.label,
          value: f.present === null ? "Unknown" : f.present ? "Present" : "Absent",
          severity,
          confidence: f.present === null ? "Insufficient Data" : "Medium",
          source: "TrustGraph website analyzer",
          explanation: f.detail ?? "",
          evidence: website.finalUrl ? { observedAt: website.finalUrl } : undefined,
        });
      }
    }
  } else if (source.type !== "website" && source.type !== "product") {
    signals.push({
      category: "website",
      key: "no_website",
      label: "Associated website",
      severity: "unknown",
      confidence: "Insufficient Data",
      source: "TrustGraph input parser",
      explanation: "No analyzable website was provided for this source. Website-based signals are unavailable.",
    });
  }

  // ---- Seller identity signals ----
  signals.push({
    category: "seller",
    key: "identity_confidence",
    label: "Seller identity confidence",
    value: identityConfidence,
    severity: identityConfidence === "High" ? "positive" : identityConfidence === "Insufficient Data" || identityConfidence === "Low" ? "unknown" : "positive",
    confidence: identityConfidence,
    source: "TrustGraph entity resolution",
    explanation:
      identityConfidence === "Insufficient Data"
        ? "There is not enough information to confidently resolve the seller's identity across channels."
        : `The seller's identity across channels is assessed at ${identityConfidence.toLowerCase()} confidence based on matching evidence.`,
  });

  signals.push({
    category: "seller",
    key: "business_info",
    label: "Business / contact information",
    severity: hasBusinessInfo ? "positive" : "unknown",
    confidence: hasBusinessInfo ? "Medium" : "Insufficient Data",
    source: "TrustGraph analyzer",
    explanation: hasBusinessInfo
      ? "Business or contact information was observed for this seller."
      : "No verifiable business or contact information has been collected yet.",
  });

  if (!source.analyzable && source.note) {
    signals.push({
      category: "confidence",
      key: "source_access",
      label: "Source data access",
      severity: "unknown",
      confidence: "Insufficient Data",
      source: "TrustGraph input parser",
      explanation: source.note,
    });
  }

  // ---- Reputation / purchase signals from customer reports ----
  if (reportStats.total > 0) {
    const dims: Array<{ key: string; label: string; value: number | null; cat: DimensionKey }> = [
      { key: "delivery", label: "Delivery experience", value: reportStats.deliveryPositivePct, cat: "purchase" },
      { key: "product_accuracy", label: "Product accuracy", value: reportStats.productAccuracyPct, cat: "purchase" },
      { key: "product_condition", label: "Product condition", value: reportStats.conditionPositivePct, cat: "purchase" },
      { key: "refund", label: "Refund experience", value: reportStats.refundPositivePct, cat: "purchase" },
      { key: "support", label: "Customer support", value: reportStats.supportPositivePct, cat: "reputation" },
    ];
    for (const d of dims) {
      if (d.value === null) continue;
      const severity: EngineSignal["severity"] = d.value >= 75 ? "positive" : d.value >= 55 ? "unknown" : "warning";
      signals.push({
        category: d.cat,
        key: `report_${d.key}`,
        label: `${d.label} (customer reports)`,
        value: pct(d.value),
        severity,
        confidence: reportStats.total >= CONFIDENCE_RULES.minReportsForReputationHigh ? "Medium" : "Low",
        source: "Customer reports submitted to TrustGraph",
        explanation: `${d.value}% of ${reportStats.total} customer-reported experiences were positive for ${d.label.toLowerCase()}. These are reported customer experiences and do not independently establish wrongdoing.`,
        evidence: { totalReports: reportStats.total, positivePct: d.value },
      });
    }
    for (const issue of reportStats.commonIssues.slice(0, 3)) {
      signals.push({
        category: "reputation",
        key: `issue_${issue.toLowerCase().replace(/\s+/g, "_")}`,
        label: `Reported issue: ${issue}`,
        severity: "warning",
        confidence: "Low",
        source: "Customer reports submitted to TrustGraph",
        explanation: `Multiple customer reports mention "${issue}". These are reported customer experiences and do not independently establish wrongdoing.`,
      });
    }
  } else {
    signals.push({
      category: "reputation",
      key: "no_reports",
      label: "Customer experience data",
      severity: "unknown",
      confidence: "Insufficient Data",
      source: "TrustGraph",
      explanation: "No customer-submitted experiences are available yet for this seller.",
    });
  }

  return signals;
}

function scoreDimension(signals: EngineSignal[], key: DimensionKey): DimensionResult {
  const relevant = signals.filter((s) => s.category === key);
  let positives = 0;
  let warnings = 0;
  let unknowns = 0;
  let riskWeight = 0;
  let totalWeight = 0;

  for (const s of relevant) {
    if (s.severity === "positive") {
      positives++;
      totalWeight += SIGNAL_WEIGHTS.positive;
    } else if (s.severity === "warning") {
      warnings++;
      riskWeight += SIGNAL_WEIGHTS.warning;
      totalWeight += SIGNAL_WEIGHTS.warning;
    } else {
      unknowns++;
    }
  }

  const score = totalWeight === 0 ? 0 : Math.round((riskWeight / totalWeight) * 100);

  let level: RiskLevel;
  if (positives + warnings === 0) {
    level = "Insufficient Information";
  } else {
    level = RISK_THRESHOLDS.find((t) => score <= t.max)?.label ?? "High Risk";
  }

  return { key, label: RISK_DIMENSIONS[key], level, score, positives, warnings, unknowns };
}

function determineConfidence(signals: EngineSignal[], reportStats: ReportStats): ConfidenceLevel {
  const evidenceSignals = signals.filter((s) => s.severity !== "unknown").length;
  const sources = new Set(signals.map((s) => s.source)).size;

  if (evidenceSignals < 3) return "Insufficient Data";
  if (evidenceSignals >= CONFIDENCE_RULES.minSignalsForHigh && sources >= 2 && reportStats.total >= CONFIDENCE_RULES.minReportsForReputationHigh) {
    return "High";
  }
  if (evidenceSignals >= CONFIDENCE_RULES.minSignalsForMedium && sources >= 2) return "Medium";
  return "Low";
}

export function computeTrust(input: EngineInput): TrustResult {
  const signals = buildSignals(input);

  const dimensionKeys: DimensionKey[] = ["seller", "website", "purchase", "reputation", "confidence"];
  const dimensions = dimensionKeys.map((k) => scoreDimension(signals, k));

  const positiveCount = signals.filter((s) => s.severity === "positive").length;
  const warningCount = signals.filter((s) => s.severity === "warning").length;
  const unknownCount = signals.filter((s) => s.severity === "unknown").length;

  const confidenceLevel = determineConfidence(signals, input.reportStats);

  // Overall score = weighted average of dimensions that actually have evidence.
  const scored = dimensions.filter((d) => d.positives + d.warnings > 0);
  const score = scored.length === 0 ? null : Math.round(scored.reduce((a, d) => a + d.score, 0) / scored.length);

  // Overall risk level
  let riskLevel: RiskLevel;
  if (confidenceLevel === "Insufficient Data" || score === null || positiveCount + warningCount < 3) {
    riskLevel = "Insufficient Information";
  } else {
    riskLevel = RISK_THRESHOLDS.find((t) => score <= t.max)?.label ?? "High Risk";
  }

  const summary = buildSummary(riskLevel, confidenceLevel, input.reportStats, warningCount, positiveCount);

  return {
    riskLevel,
    confidenceLevel,
    score,
    positiveCount,
    warningCount,
    unknownCount,
    signals,
    dimensions,
    summary,
  };
}

function buildSummary(
  risk: RiskLevel,
  confidence: ConfidenceLevel,
  stats: ReportStats,
  warnings: number,
  positives: number,
): string {
  if (risk === "Insufficient Information") {
    return "There is not enough independent evidence to form a confident trust assessment for this seller. This does not indicate the seller is untrustworthy — it means available information is limited. Verify key details directly before paying.";
  }
  const parts: string[] = [];
  parts.push(`Based on available evidence, this seller is currently assessed as ${risk.toLowerCase()} at ${confidence.toLowerCase()} confidence.`);
  parts.push(`We identified ${positives} positive and ${warnings} warning signal(s).`);
  if (stats.total > 0) {
    parts.push(`This includes analysis of ${stats.total} customer-reported experience(s).`);
  }
  parts.push("This is an evidence-based assessment of risk, not a guarantee of safety or a claim of wrongdoing.");
  return parts.join(" ");
}
