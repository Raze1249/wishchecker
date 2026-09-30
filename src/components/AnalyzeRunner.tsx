"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Stage {
  key: string;
  label: string;
  done: boolean;
}

export default function AnalyzeRunner({ input }: { input: string }) {
  const router = useRouter();
  const [stages, setStages] = useState<Stage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function run() {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input }),
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Analysis could not be started.");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            const evt = JSON.parse(line);
            if (evt.type === "stage") {
              setStages((prev) => {
                const marked = prev.map((s) => ({ ...s, done: true }));
                return [...marked, { key: evt.key, label: evt.label, done: false }];
              });
            } else if (evt.type === "done") {
              setStages((prev) => prev.map((s) => ({ ...s, done: true })));
              router.push(`/report/${evt.assessmentId}`);
              return;
            } else if (evt.type === "error") {
              setError(evt.message);
              return;
            }
          }
        }
      } catch {
        setError("A network error occurred during analysis.");
      }
    }

    run();
  }, [input, router]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-semibold text-red-800">Analysis could not be completed</h2>
        <p className="mt-2 text-sm text-red-700">{error}</p>
        <p className="mt-3 text-xs text-red-600">
          This does not indicate the seller is untrustworthy. It means the source could not be analyzed right now. You can
          still search for the seller or submit a customer experience.
        </p>
        <button onClick={() => router.push("/analyze")} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500">
          Try another source
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
        <h2 className="font-semibold text-slate-900">Analyzing seller…</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500 break-all">Source: {input}</p>
      <div className="mt-5 space-y-2">
        {stages.length === 0 && <div className="text-sm text-slate-400">Starting analysis…</div>}
        {stages.map((s) => (
          <div key={s.key} className="tg-fade-up flex items-center gap-3 text-sm">
            {s.done ? (
              <span className="text-emerald-600">✓</span>
            ) : (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            )}
            <span className={s.done ? "text-slate-700" : "font-medium text-slate-900"}>{s.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs text-slate-400">Only stages that are actually performed are shown. No fake progress.</p>
    </div>
  );
}
