// AI Layer — provides review classification, sentiment, policy analysis and an
// experience summary.
//
// If an LLM API key (OPENAI_API_KEY) is configured, a real provider could be
// wired in here through a secure backend abstraction. Until then we use a
// transparent, deterministic heuristic classifier so the product remains
// useful and honest. All AI/heuristic output is clearly labeled as analysis.

export type ReportCategory =
  | "Delivery"
  | "Refund"
  | "Wrong product"
  | "Damaged product"
  | "Product quality"
  | "Customer support"
  | "Payment"
  | "Positive experience"
  | "Other";

export type Sentiment = "Positive" | "Neutral" | "Negative" | "Mixed";

const CATEGORY_KEYWORDS: Array<{ cat: ReportCategory; words: string[] }> = [
  { cat: "Refund", words: ["refund", "money back", "reimburse", "chargeback"] },
  { cat: "Delivery", words: ["deliver", "shipping", "arrive", "late", "never came", "tracking"] },
  { cat: "Wrong product", words: ["wrong", "different item", "not what i ordered", "incorrect"] },
  { cat: "Damaged product", words: ["damaged", "broken", "defective", "cracked", "torn"] },
  { cat: "Product quality", words: ["quality", "cheap", "fake", "poor material", "flimsy"] },
  { cat: "Customer support", words: ["support", "service", "response", "ignored", "no reply", "rude"] },
  { cat: "Payment", words: ["payment", "charged", "overcharged", "card", "billing"] },
  { cat: "Positive experience", words: ["great", "excellent", "happy", "recommend", "perfect", "love"] },
];

const NEGATIVE_WORDS = ["not", "never", "bad", "poor", "worst", "delay", "damaged", "broken", "wrong", "scam", "fake", "rude", "ignored", "disappointed"];
const POSITIVE_WORDS = ["great", "good", "excellent", "happy", "recommend", "perfect", "love", "fast", "smooth", "helpful"];

export interface AiReportAnalysis {
  category: ReportCategory;
  sentiment: Sentiment;
  method: "heuristic" | "llm";
}

export function classifyReport(text: string): AiReportAnalysis {
  const t = (text || "").toLowerCase();
  let category: ReportCategory = "Other";
  for (const c of CATEGORY_KEYWORDS) {
    if (c.words.some((w) => t.includes(w))) {
      category = c.cat;
      break;
    }
  }

  const neg = NEGATIVE_WORDS.filter((w) => t.includes(w)).length;
  const pos = POSITIVE_WORDS.filter((w) => t.includes(w)).length;
  let sentiment: Sentiment = "Neutral";
  if (pos > 0 && neg > 0) sentiment = "Mixed";
  else if (pos > neg) sentiment = "Positive";
  else if (neg > pos) sentiment = "Negative";

  return { category, sentiment, method: "heuristic" };
}

export interface PolicyIssue {
  severity: "info" | "warning";
  text: string;
}

// Analyze presence/absence of policies from website findings.
export function analyzePolicies(findings: Array<{ key: string; present: boolean | null; label: string }>): PolicyIssue[] {
  const issues: PolicyIssue[] = [];
  const policyKeys = ["refund_policy", "return_policy", "privacy_policy", "terms", "shipping_policy"];
  for (const key of policyKeys) {
    const f = findings.find((x) => x.key === key);
    if (!f) continue;
    if (f.present === false) {
      issues.push({ severity: "warning", text: `No ${f.label.toLowerCase()} was detected on the homepage. Buyers may lack clarity on this topic.` });
    }
  }
  if (issues.length === 0) {
    issues.push({ severity: "info", text: "Core policies referenced on the homepage appear to be present. Presence does not verify the quality or fairness of the terms." });
  }
  return issues;
}

// Generate an honest experience summary from aggregate stats.
export function summarizeExperience(stats: {
  total: number;
  deliveryPositivePct: number | null;
  refundPositivePct: number | null;
  productAccuracyPct: number | null;
  supportPositivePct: number | null;
}): string {
  if (stats.total === 0) return "No customer-reported experiences are available yet, so no experience summary can be generated.";
  const weak: string[] = [];
  const strong: string[] = [];
  const push = (label: string, v: number | null) => {
    if (v === null) return;
    if (v < 65) weak.push(label);
    else if (v >= 80) strong.push(label);
  };
  push("delivery", stats.deliveryPositivePct);
  push("refunds", stats.refundPositivePct);
  push("product accuracy", stats.productAccuracyPct);
  push("customer support", stats.supportPositivePct);

  let s = `Among the ${stats.total} available customer report(s), `;
  if (weak.length) s += `${weak.join(" and ")} issues appear more frequently`;
  else s += "no single category stands out as especially problematic";
  if (strong.length) s += `, while ${strong.join(" and ")} were more often reported positively`;
  s += ". This is an analysis of available reports, not an independently verified conclusion.";
  return s;
}
