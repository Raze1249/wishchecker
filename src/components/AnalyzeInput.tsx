"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AnalyzeInput({ autoFocus }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim();
    if (!v) return;
    router.push(`/analyze?input=${encodeURIComponent(v)}`);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Paste a website, Instagram profile, product link, or seller information..."
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
      />
      <button
        type="submit"
        className="shrink-0 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Analyze
      </button>
    </form>
  );
}
