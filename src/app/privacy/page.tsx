export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose-slate">
      <h1 className="text-3xl font-bold text-slate-900">Privacy</h1>
      <p className="mt-4 text-slate-600">
        This is a demonstration/portfolio application. The policy below describes the intended privacy posture.
      </p>
      <div className="mt-6 space-y-6 text-sm text-slate-600">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Data we collect</h2>
          <p className="mt-2">Account details (name, email, hashed password), the sources you analyze, sellers you monitor, and the customer experiences you choose to submit.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Data minimization</h2>
          <p className="mt-2">We collect only what is necessary. We never ask for or store payment card details. Passwords are hashed with scrypt and never stored in plain text.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">User-submitted reports</h2>
          <p className="mt-2">Please redact sensitive personal information from your reports. Reports are treated as customer-reported experiences and are reviewed before affecting a seller&apos;s trust profile.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">External sources</h2>
          <p className="mt-2">We only access data that can be retrieved legally and technically. We do not scrape platforms in violation of their terms.</p>
        </section>
      </div>
    </div>
  );
}
