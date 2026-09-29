export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">About TrustGraph</h1>
      <p className="mt-4 text-lg text-slate-600">Universal Shopping Trust Infrastructure.</p>
      <p className="mt-4 text-slate-600">
        TrustGraph connects seller identity, shopping channels, customer experiences, reputation signals and historical
        evidence into an explainable trust profile for online commerce. The core question it answers is:
      </p>
      <blockquote className="mt-4 border-l-4 border-emerald-500 bg-emerald-50 p-4 text-slate-700">
        Who am I buying from, what evidence do we have about them, what risks exist, and what should I know before I pay?
      </blockquote>

      <h2 className="mt-10 text-xl font-semibold text-slate-900">Our principles</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          ["Evidence over labels", "We prefer \"multiple warning signals were detected\" over \"scam\"."],
          ["Transparency over black-box scoring", "Users can understand why an assessment was generated."],
          ["Confidence matters", "No evidence is not the same as a bad seller."],
          ["Reports aren't automatically facts", "Customer experiences are clearly distinguished from verified information."],
          ["Historical context matters", "A seller's status can change over time."],
          ["Cross-platform identity matters", "A seller may operate through multiple channels."],
          ["Privacy matters", "We collect only necessary user data."],
          ["Avoid defamation", "We never present allegations as established facts."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-slate-900">{t}</h3>
            <p className="mt-1 text-sm text-slate-600">{d}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-sm text-indigo-800">
        <strong>Demo data notice:</strong> Any seller marked &quot;DEMO&quot; is fictional and used to illustrate the product. TrustGraph
        never fabricates reports about real businesses.
      </div>
    </div>
  );
}
