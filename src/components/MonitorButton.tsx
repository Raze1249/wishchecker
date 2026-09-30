"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MonitorButton({ sellerId, isAuthed, initiallyMonitoring }: { sellerId: string; isAuthed: boolean; initiallyMonitoring: boolean }) {
  const router = useRouter();
  const [monitoring, setMonitoring] = useState(initiallyMonitoring);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!isAuthed) {
      router.push("/login?next=/dashboard");
      return;
    }
    setLoading(true);
    if (monitoring) {
      await fetch(`/api/monitoring?sellerId=${sellerId}`, { method: "DELETE" });
      setMonitoring(false);
    } else {
      await fetch("/api/monitoring", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sellerId }) });
      setMonitoring(true);
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
        monitoring ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      } disabled:opacity-60`}
    >
      {loading ? "…" : monitoring ? "✓ Monitoring" : "🔔 Monitor this seller"}
    </button>
  );
}
