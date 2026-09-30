const STAGES = [
  { t: "Detect source type", d: "The universal input parser recognizes websites, product links, Instagram/Facebook/TikTok profiles, marketplace URLs and messaging contacts." },
  { t: "Extract seller / product / domain", d: "We normalize the input and extract the domain, handle or identifier." },
  { t: "Resolve seller identity", d: "Entity resolution compares business name, domain, linked profiles and contact info to connect channels — always with confidence and evidence." },
  { t: "Collect trust signals", d: "The website analyzer safely fetches the homepage (behind an SSRF guard) and records factual signals: HTTPS, contact info, policies, MX records." },
  { t: "Analyze customer experience", d: "Approved, user-submitted reports are aggregated into delivery / accuracy / condition / refund / support categories." },
  { t: "AI analysis", d: "Reports are classified and sentiment-scored; policies are checked for missing information. All AI output is clearly labeled as analysis." },
  { t: "Trust engine", d: "A transparent, configurable signal framework produces positive / warning / unknown signals, per-dimension risk and a confidence level." },
  { t: "Purchase Trust Report", d: "Everything is presented evidence-first with expandable explanations and clear data provenance." },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">How TrustGraph works</h1>
      <p className="mt-3 text-slate-600">
        TrustGraph is not a &quot;paste a URL, get SAFE/SCAM&quot; tool. It is a shopping trust <em>infrastructure</em> built around an
        explainable pipeline. Here is exactly what happens when you analyze a source.
      </p>

      <ol className="mt-8 space-y-4">
        {STAGES.map((s, i) => (
          <li key={s.t} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-900 text-sm font-bold text-white">{i + 1}</div>
            <div>
              <h3 className="font-semibold text-slate-900">{s.t}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="font-semibold text-slate-900">What we don&apos;t do</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>• We do not claim certainty or guarantee a seller is safe.</li>
          <li>• We do not automatically accuse a business of fraud.</li>
          <li>• We do not scrape platforms in violation of their policies.</li>
          <li>• We do not treat no-information as high risk — it becomes &quot;Insufficient Information&quot;.</li>
        </ul>
      </div>
    </div>
  );
}
