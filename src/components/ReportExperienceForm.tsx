"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface SellerResult {
  id: string;
  name: string;
  domain: string | null;
}

function YesNo({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2.5">
      <span className="text-sm text-slate-700">{label}</span>
      <div className="flex gap-1">
        {["yes", "no", "n/a"].map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`rounded-md px-3 py-1 text-xs font-medium capitalize ${
              value === opt ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReportExperienceForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [sellerId, setSellerId] = useState(params.get("sellerId") ?? "");
  const [sellerName, setSellerName] = useState("");
  const [q, setQ] = useState("");
  const [candidates, setCandidates] = useState<SellerResult[]>([]);

  const [form, setForm] = useState({
    purchaseItem: "",
    purchaseChannel: "",
    received: "n/a",
    correctProduct: "n/a",
    damaged: "n/a",
    asDescribed: "n/a",
    requestedRefund: "n/a",
    receivedRefund: "n/a",
    supportRating: "",
    description: "",
  });
  const [status, setStatus] = useState<{ type: "idle" | "error" | "success"; msg?: string }>({ type: "idle" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadName() {
      if (!sellerId) return;
      const res = await fetch(`/api/v1/entity/${sellerId}`);
      if (res.ok) {
        const data = await res.json();
        setSellerName(data.entity?.name ?? "");
      }
    }
    loadName();
  }, [sellerId]);

  async function searchSeller(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 2) return;
    const res = await fetch(`/api/v1/search?q=${encodeURIComponent(q.trim())}`);
    const data = await res.json();
    setCandidates(data.results ?? []);
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const toBool = (v: string) => (v === "yes" ? true : v === "no" ? false : null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!sellerId) {
      setStatus({ type: "error", msg: "Please select the seller you purchased from." });
      return;
    }
    setSubmitting(true);
    setStatus({ type: "idle" });
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sellerId,
        purchaseItem: form.purchaseItem,
        purchaseChannel: form.purchaseChannel,
        received: toBool(form.received),
        correctProduct: toBool(form.correctProduct),
        damaged: toBool(form.damaged),
        asDescribed: toBool(form.asDescribed),
        requestedRefund: toBool(form.requestedRefund),
        receivedRefund: toBool(form.receivedRefund),
        supportRating: form.supportRating || undefined,
        description: form.description,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setStatus({ type: "error", msg: data.error ?? "Submission failed." });
      return;
    }
    setStatus({ type: "success", msg: data.message });
  }

  if (status.type === "success") {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="font-semibold text-emerald-800">Thank you</h2>
        <p className="mt-2 text-sm text-emerald-700">{status.msg}</p>
        <button onClick={() => router.push(`/seller/${sellerId}`)} className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">
          View seller profile
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-6">
      {/* Seller selection */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <label className="text-sm font-semibold text-slate-900">Seller</label>
        {sellerId ? (
          <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5">
            <span className="text-sm text-slate-700">{sellerName || sellerId}</span>
            <button type="button" onClick={() => { setSellerId(""); setSellerName(""); }} className="text-xs text-slate-500 hover:text-slate-800">Change</button>
          </div>
        ) : (
          <div className="mt-2">
            <div className="flex gap-2">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the seller by name or domain" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900" />
              <button type="button" onClick={searchSeller} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Find</button>
            </div>
            <div className="mt-2 space-y-1">
              {candidates.map((c) => (
                <button key={c.id} type="button" onClick={() => { setSellerId(c.id); setSellerName(c.name); }} className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50">
                  {c.name} {c.domain && <span className="text-xs text-slate-400">· {c.domain}</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">What did you purchase?</label>
            <input value={form.purchaseItem} onChange={(e) => set("purchaseItem", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Where did you purchase it?</label>
            <input value={form.purchaseChannel} onChange={(e) => set("purchaseChannel", e.target.value)} placeholder="Website / Instagram / WhatsApp…" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900" />
          </div>
        </div>

        <div className="space-y-2">
          <YesNo label="Did you receive the order?" value={form.received} onChange={(v) => set("received", v)} />
          <YesNo label="Did you receive the correct product?" value={form.correctProduct} onChange={(v) => set("correctProduct", v)} />
          <YesNo label="Was the product damaged?" value={form.damaged} onChange={(v) => set("damaged", v)} />
          <YesNo label="Was the product as described?" value={form.asDescribed} onChange={(v) => set("asDescribed", v)} />
          <YesNo label="Did you request a refund?" value={form.requestedRefund} onChange={(v) => set("requestedRefund", v)} />
          <YesNo label="Did you receive the refund?" value={form.receivedRefund} onChange={(v) => set("receivedRefund", v)} />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">How was customer support?</label>
          <div className="mt-1 flex gap-2">
            {["Good", "Average", "Poor"].map((r) => (
              <button key={r} type="button" onClick={() => set("supportRating", r)} className={`rounded-lg px-4 py-2 text-sm font-medium ${form.supportRating === r ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Describe your experience</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900" placeholder="Please avoid sharing sensitive personal information. Redact order numbers and private details." />
          <p className="mt-1 text-xs text-slate-400">Protect your privacy — redact sensitive information. Minimum 10 characters.</p>
        </div>
      </div>

      {status.type === "error" && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{status.msg}</p>}

      <button disabled={submitting} className="w-full rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
        {submitting ? "Submitting…" : "Submit experience"}
      </button>
    </form>
  );
}
