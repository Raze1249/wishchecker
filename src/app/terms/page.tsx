export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Terms</h1>
      <p className="mt-4 text-slate-600">This is a demonstration/portfolio application. By using it you acknowledge the following.</p>
      <div className="mt-6 space-y-6 text-sm text-slate-600">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Not a guarantee</h2>
          <p className="mt-2">TrustGraph provides evidence-based risk information. It does not guarantee that any seller is legitimate or safe, and it does not assert that any seller has committed wrongdoing. Risk labels describe the available evidence, not absolute claims.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Customer reports</h2>
          <p className="mt-2">Customer reports are user-submitted experiences. You agree to submit only truthful, good-faith reports and to avoid coordinated manipulation. Abusive reporting may result in removal and account action.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Your decisions</h2>
          <p className="mt-2">You are responsible for your own purchasing decisions. Always verify important details and use payment methods with buyer protection where possible.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Dispute mechanism</h2>
          <p className="mt-2">Sellers and users may contest information. Contested data can be marked &quot;disputed&quot; pending review.</p>
        </section>
      </div>
    </div>
  );
}
