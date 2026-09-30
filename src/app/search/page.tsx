"use client";

import { useState } from "react";
import Link from "next/link";
import { platformIcon } from "@/lib/trustColors";

interface Result {
  id: string;
  name: string;
  domain: string | null;
  platforms: string[];
  identityConfidence: string;
  isDemo: boolean;
}

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    const res = await fetch(`/api/v1/search?q=${encodeURIComponent(q.trim())}`);
    const data = await res.json();
    setResults(data.results ?? []);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Search sellers</h1>
      <p className="mt-2 text-sm text-slate-600">Search by business name, domain or social handle.</p>

      <form onSubmit={search} className="mt-6 flex gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. Demo Fashion, example.com, @seller"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />
        <button className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">Search</button>
      </form>

      <div className="mt-8 space-y-3">
        {loading && <p className="text-sm text-slate-500">Searching…</p>}
        {!loading && searched && results.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            No sellers found. Try{" "}
            <Link href={`/analyze?input=${encodeURIComponent(q)}`} className="font-medium text-emerald-700 hover:underline">
              analyzing this source
            </Link>{" "}
            to create a profile.
          </div>
        )}
        {results.map((r) => (
          <Link key={r.id} href={`/seller/${r.id}`} className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{r.name}</span>
                  {r.isDemo && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">DEMO</span>}
                </div>
                {r.domain && <div className="text-xs text-slate-500">{r.domain}</div>}
              </div>
              <div className="flex items-center gap-1 text-sm">
                {(r.platforms ?? []).map((p) => (
                  <span key={p} title={p}>{platformIcon[p] ?? "🔗"}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
