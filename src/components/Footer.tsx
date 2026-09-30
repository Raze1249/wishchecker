import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-white">🛡️</span>
              <span className="text-lg font-semibold text-slate-900">
                Trust<span className="text-emerald-600">Graph</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              Universal Shopping Trust Infrastructure. Know who you&apos;re buying from before you pay.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Product</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li><Link href="/analyze" className="hover:text-slate-900">Analyze a source</Link></li>
              <li><Link href="/search" className="hover:text-slate-900">Search sellers</Link></li>
              <li><Link href="/report-experience" className="hover:text-slate-900">Report an experience</Link></li>
              <li><Link href="/monitoring" className="hover:text-slate-900">Monitoring</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li><Link href="/about" className="hover:text-slate-900">About</Link></li>
              <li><Link href="/how-it-works" className="hover:text-slate-900">How it works</Link></li>
              <li><Link href="/privacy" className="hover:text-slate-900">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-slate-900">Terms</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Developers</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li><code className="text-xs">GET /api/v1/trust/seller/:id</code></li>
              <li><code className="text-xs">GET /api/v1/search</code></li>
              <li><code className="text-xs">GET /api/v1/history/:id</code></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
          <strong className="text-slate-700">Disclaimer:</strong> TrustGraph provides evidence-based risk information — not a
          guarantee that a seller is legitimate or safe. Customer reports are user-submitted experiences and do not
          independently establish wrongdoing. Always verify important details before you pay.
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">© {new Date().getFullYear()} TrustGraph. For demonstration and portfolio purposes.</p>
      </div>
    </footer>
  );
}
