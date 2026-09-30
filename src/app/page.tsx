import Link from "next/link";
import AnalyzeInput from "@/components/AnalyzeInput";

const SOURCES = ["Websites", "Instagram", "Social sellers", "Marketplaces", "Product links", "Messaging-based sellers"];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="tg-grid-bg absolute inset-0 opacity-70" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center">
          <span className="inline-block rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            Universal Shopping Trust Infrastructure
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Know Who You&apos;re Buying From <span className="text-emerald-600">Before You Pay.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Analyze websites, social sellers, marketplace accounts and other online shopping sources using evidence-based
            trust signals and real customer experiences.
          </p>

          <div className="mx-auto mt-8 max-w-2xl">
            <AnalyzeInput />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-600">
            {["Websites", "Social sellers", "Marketplace sellers", "Product links", "Online stores"].map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className="text-emerald-600">✓</span> {s}
              </span>
            ))}
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-xs text-slate-400">
            TrustGraph does not guarantee that a seller is legitimate. It analyzes available evidence and highlights risks,
            positive signals and unknowns so you can make a more informed decision.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-slate-900">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            { n: 1, t: "Enter a shopping source", d: "Paste a website, social profile, product link or seller info." },
            { n: 2, t: "We identify the seller", d: "Detect the platform and resolve the seller identity across channels." },
            { n: 3, t: "We analyze evidence", d: "Website signals, policies and customer experiences are examined." },
            { n: 4, t: "We show the trust profile", d: "Positive signals, warnings, unknowns and confidence — explained." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-sm font-bold text-white">{s.n}</div>
              <h3 className="mt-4 font-semibold text-slate-900">{s.t}</h3>
              <p className="mt-2 text-sm text-slate-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Supported sources */}
      <section className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900">Supported shopping sources</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-500">
            We only analyze data that can be accessed legally and technically. For social and messaging sellers we resolve
            identity and rely on user-submitted evidence rather than scraping.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SOURCES.map((s) => (
              <div key={s} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-lg">🔎</span>
                <span className="font-medium text-slate-800">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example report */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">An explainable Purchase Trust Report</h2>
            <p className="mt-3 text-slate-600">
              Every important signal is expandable and evidence-first. We clearly separate verified data, user-submitted
              reports, publicly available information and AI-generated analysis — and we always show a confidence level.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-700">
              {["Evidence over labels", "Cross-platform identity", "Real customer experiences", "Explainable dimensions", "Historical changes", "Privacy-aware"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/analyze" className="mt-6 inline-block rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
              Analyze a source
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-slate-900">Demo Fashion Store</div>
                <div className="text-xs text-slate-500">Seller Trust Profile · DEMO DATA</div>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Moderate Risk</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-emerald-50 p-3"><div className="text-lg font-bold text-emerald-600">8</div><div className="text-[11px] text-slate-500">Positive</div></div>
              <div className="rounded-lg bg-amber-50 p-3"><div className="text-lg font-bold text-amber-600">4</div><div className="text-[11px] text-slate-500">Warnings</div></div>
              <div className="rounded-lg bg-slate-50 p-3"><div className="text-lg font-bold text-slate-500">3</div><div className="text-[11px] text-slate-500">Unknown</div></div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"><span>✓</span> HTTPS enabled</div>
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"><span>⚠</span> Refund complaints reported</div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"><span>?</span> Domain age unavailable</div>
            </div>
            <p className="mt-3 text-xs text-slate-400">Illustrative example. Confidence: High. Reports analyzed: 428.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 pb-8">
        <div className="rounded-2xl bg-slate-900 p-8 text-center text-white">
          <h2 className="text-2xl font-bold">Make a more informed purchase.</h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-300">
            From &quot;Should I buy from this seller?&quot; to a clear understanding of who they are, what evidence exists, and what to verify.
          </p>
          <Link href="/analyze" className="mt-6 inline-block rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-400">
            Start an analysis
          </Link>
        </div>
      </section>
    </div>
  );
}
