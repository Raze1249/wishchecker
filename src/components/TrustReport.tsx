import Link from "next/link";
import type { getSellerReport } from "@/server/reports/getReport";
import { riskStyle, confidenceStyle, platformIcon } from "@/lib/trustColors";
import SignalItem, { type SignalItemData } from "./SignalItem";
import TrustGraphViz from "./TrustGraphViz";
import MonitorButton from "./MonitorButton";

type ReportData = NonNullable<Awaited<ReturnType<typeof getSellerReport>>>;

const CATEGORY_GROUPS: Array<{ key: string; title: string; blurb: string }> = [
  { key: "seller", title: "Seller Identity", blurb: "Who the seller appears to be and how confidently we can resolve it." },
  { key: "website", title: "Website", blurb: "Observable, factual signals from the website (presence/absence only)." },
  { key: "purchase", title: "Purchase & Delivery", blurb: "Customer-reported experiences about orders, delivery and refunds." },
  { key: "reputation", title: "Reputation & Customer Experience", blurb: "Patterns across customer-submitted experiences." },
  { key: "confidence", title: "Information Confidence", blurb: "How much and how good the available evidence is." },
];

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
      <div className={`text-2xl font-bold ${tone ?? "text-slate-900"}`}>{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

function ExperienceBar({ label, pct }: { label: string; pct: number | null }) {
  if (pct === null) {
    return (
      <div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">{label}</span>
          <span className="text-slate-400">No data</span>
        </div>
        <div className="mt-1 h-2 w-full rounded-full bg-slate-100" />
      </div>
    );
  }
  const color = pct >= 75 ? "bg-emerald-500" : pct >= 55 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-800">{pct}% positive</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function TrustReport({ data, isAuthed, isMonitoring }: { data: ReportData; isAuthed: boolean; isMonitoring: boolean }) {
  const { seller, assessment, signals, reportStats, relationships, history, experienceSummary, domains, socialAccounts, products } = data;
  const rs = riskStyle(assessment?.riskLevel ?? "Insufficient Information");
  const cs = confidenceStyle(assessment?.confidenceLevel ?? "Insufficient Data");

  const channels = [
    ...domains.map((d) => ({ type: "Website", label: d.domain })),
    ...socialAccounts.map((s) => ({ type: s.platform, label: s.handle ? `@${s.handle}` : s.platform })),
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            {seller.isDemo && (
              <span className="mb-2 inline-block rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                DEMO DATA — fictional seller
              </span>
            )}
            <h1 className="text-2xl font-bold text-slate-900">{seller.name}</h1>
            <p className="mt-1 text-sm text-slate-500">Seller Trust Profile</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(seller.platformTypes ?? []).map((p) => (
                <span key={p} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                  <span>{platformIcon[p] ?? "🔗"}</span> {p}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2">
            <MonitorButton sellerId={seller.id} isAuthed={isAuthed} initiallyMonitoring={isMonitoring} />
            <Link href={`/report-experience?sellerId=${seller.id}`} className="text-sm font-medium text-emerald-700 hover:underline">
              + Share your experience
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className={`rounded-xl border ${rs.border} ${rs.bg} p-4 text-center`}>
            <div className="flex items-center justify-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${rs.dot}`} />
              <span className={`text-sm font-bold ${rs.text}`}>{assessment?.riskLevel ?? "Insufficient Information"}</span>
            </div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">Risk Level</div>
          </div>
          <div className={`rounded-xl border border-slate-200 p-4 text-center ${cs.bg}`}>
            <div className={`text-sm font-bold ${cs.text}`}>{assessment?.confidenceLevel ?? "Insufficient Data"}</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">Confidence</div>
          </div>
          <Stat label="Positive Signals" value={assessment?.positiveCount ?? 0} tone="text-emerald-600" />
          <Stat label="Warning Signals" value={assessment?.warningCount ?? 0} tone="text-amber-600" />
          <Stat label="Unknown Signals" value={assessment?.unknownCount ?? 0} tone="text-slate-500" />
        </div>

        {assessment?.summary && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {assessment.summary}
          </div>
        )}

        {typeof assessment?.score === "number" && (
          <p className="mt-3 text-xs text-slate-400">
            Secondary composite risk score: <span className="font-medium text-slate-500">{assessment.score}/100</span> (higher = more risk). This score is
            secondary to the evidence below.
          </p>
        )}
      </div>

      {/* Data provenance legend */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">How to read this report</h3>
        <div className="mt-3 grid gap-3 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-emerald-50 p-3"><strong className="text-emerald-700">✓ Positive</strong> — an observed supporting signal.</div>
          <div className="rounded-lg bg-amber-50 p-3"><strong className="text-amber-700">⚠ Warning</strong> — an observed concern worth verifying.</div>
          <div className="rounded-lg bg-slate-50 p-3"><strong className="text-slate-600">? Unknown</strong> — information is missing (not a negative).</div>
          <div className="rounded-lg bg-indigo-50 p-3"><strong className="text-indigo-700">Sources vary</strong> — website analysis, customer reports, and inference are labeled per-signal.</div>
        </div>
      </div>

      {/* Risk dimensions */}
      {assessment && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Risk dimensions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(assessment.riskDimensions).map(([key, dim]) => {
              const d = riskStyle(dim.level);
              return (
                <div key={key} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{dim.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${d.bg} ${d.text}`}>{dim.level}</span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full ${d.dot}`} style={{ width: `${Math.max(4, dim.score)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Signals by category */}
      <div className="space-y-6">
        {CATEGORY_GROUPS.map((group) => {
          const groupSignals = signals.filter((s) => s.category === group.key);
          if (groupSignals.length === 0) return null;
          return (
            <div key={group.key}>
              <h2 className="text-lg font-semibold text-slate-900">{group.title}</h2>
              <p className="mb-3 text-sm text-slate-500">{group.blurb}</p>
              <div className="space-y-2">
                {groupSignals.map((s) => (
                  <SignalItem key={s.id} signal={s as unknown as SignalItemData} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer experience analytics */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Customer Experience</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{reportStats.total} reports analyzed</span>
        </div>
        {reportStats.total === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            No customer-submitted experiences yet.{" "}
            <Link href={`/report-experience?sellerId=${seller.id}`} className="font-medium text-emerald-700 hover:underline">
              Be the first to share one.
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <ExperienceBar label="Delivery" pct={reportStats.deliveryPositivePct} />
              <ExperienceBar label="Product accuracy" pct={reportStats.productAccuracyPct} />
              <ExperienceBar label="Product condition" pct={reportStats.conditionPositivePct} />
              <ExperienceBar label="Refund experience" pct={reportStats.refundPositivePct} />
              <ExperienceBar label="Customer support" pct={reportStats.supportPositivePct} />
            </div>
            {reportStats.commonIssues.length > 0 && (
              <div className="mt-5">
                <h4 className="text-sm font-semibold text-slate-700">Common reported issues</h4>
                <ol className="mt-2 list-inside list-decimal text-sm text-slate-600">
                  {reportStats.commonIssues.slice(0, 5).map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ol>
              </div>
            )}
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{experienceSummary}</p>
            <p className="mt-2 text-xs text-slate-400">
              These are customer-reported experiences. They are user-submitted and do not independently establish wrongdoing.
            </p>
          </>
        )}
      </div>

      {/* Identity resolution */}
      {relationships.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Identity resolution</h2>
          <p className="mb-4 text-sm text-slate-500">Possible connections between channels — shown with confidence and evidence, never asserted as fact.</p>
          <div className="space-y-3">
            {relationships.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-800">
                    {r.fromLabel} ↔ {r.toLabel}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {r.state} · {r.confidence}%
                  </span>
                </div>
                {r.evidence.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    {r.evidence.map((e, i) => (
                      <li key={i}>✓ {e}</li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-xs text-slate-400">Contradictions: {r.contradictions.length > 0 ? r.contradictions.join(", ") : "None found"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trust graph */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Trust graph</h2>
        <TrustGraphViz sellerName={seller.name} channels={channels} productCount={products.length} reportCount={reportStats.total} />
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">History — what changed?</h2>
          <p className="mb-4 text-sm text-slate-500">Trust is not static. Observed assessments over time (most recent first).</p>
          <div className="space-y-2">
            {history.map((h) => {
              const hs = riskStyle(h.riskLevel);
              return (
                <div key={h.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2">
                  <span className="text-sm text-slate-600">{new Date(h.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${hs.bg} ${hs.text}`}>{h.riskLevel}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        TrustGraph provides an evidence-based assessment of risk — not a guarantee of safety and not an accusation of
        wrongdoing. Before you pay, verify the seller&apos;s contact details, return/refund policy, and use a payment
        method with buyer protection where possible.
      </p>
    </div>
  );
}
