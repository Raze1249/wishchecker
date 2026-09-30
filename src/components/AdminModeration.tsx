"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Report {
  id: string;
  sellerName: string;
  sellerSlugId?: string;
  purchaseItem: string | null;
  description: string | null;
  category: string | null;
  sentiment: string | null;
  status: string;
  createdAt: string;
}

export default function AdminModeration({ initial }: { initial: Report[] }) {
  const router = useRouter();
  const [reports, setReports] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function moderate(reportId: string, action: "approve" | "reject" | "dispute") {
    setBusy(reportId);
    await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, action }),
    });
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    setBusy(null);
    router.refresh();
  }

  if (reports.length === 0) {
    return <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">The moderation queue is empty. 🎉</p>;
  }

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-800">{r.sellerName}</span>
            <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleString()}</span>
          </div>
          {r.purchaseItem && <p className="mt-1 text-sm text-slate-600">Item: {r.purchaseItem}</p>}
          <p className="mt-1 text-sm text-slate-700">{r.description}</p>
          {r.category && <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">AI: {r.category} · {r.sentiment}</span>}
          <div className="mt-3 flex gap-2">
            <button disabled={busy === r.id} onClick={() => moderate(r.id, "approve")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50">Approve</button>
            <button disabled={busy === r.id} onClick={() => moderate(r.id, "dispute")} className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-400 disabled:opacity-50">Mark disputed</button>
            <button disabled={busy === r.id} onClick={() => moderate(r.id, "reject")} className="rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-500 disabled:opacity-50">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
