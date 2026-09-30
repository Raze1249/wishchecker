// Shared visual mapping for trust concepts. Colors are ALWAYS paired with text
// and icons elsewhere so the UI stays accessible.

export type Severity = "positive" | "warning" | "unknown";

export const riskStyles: Record<string, { text: string; bg: string; border: string; dot: string; label: string }> = {
  "Low Risk": { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", label: "Low Risk" },
  "Moderate Risk": { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", label: "Moderate Risk" },
  "Elevated Risk": { text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-500", label: "Elevated Risk" },
  "High Risk": { text: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", label: "High Risk" },
  "Insufficient Information": { text: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200", dot: "bg-slate-400", label: "Insufficient Information" },
};

export function riskStyle(level: string) {
  return riskStyles[level] ?? riskStyles["Insufficient Information"];
}

export const severityStyles: Record<Severity, { text: string; bg: string; border: string; icon: string; label: string }> = {
  positive: { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: "✓", label: "Positive" },
  warning: { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: "⚠", label: "Warning" },
  unknown: { text: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", icon: "?", label: "Unknown" },
};

export const confidenceStyles: Record<string, { text: string; bg: string }> = {
  High: { text: "text-emerald-700", bg: "bg-emerald-100" },
  Medium: { text: "text-amber-700", bg: "bg-amber-100" },
  Low: { text: "text-orange-700", bg: "bg-orange-100" },
  "Insufficient Data": { text: "text-slate-600", bg: "bg-slate-200" },
};

export function confidenceStyle(level: string) {
  return confidenceStyles[level] ?? confidenceStyles["Insufficient Data"];
}

export const platformIcon: Record<string, string> = {
  Website: "🌐",
  Instagram: "📸",
  Facebook: "👥",
  TikTok: "🎵",
  WhatsApp: "💬",
  Marketplace: "🛒",
  Product: "🏷️",
};
