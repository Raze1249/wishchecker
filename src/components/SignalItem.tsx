"use client";

import { useState } from "react";
import { severityStyles, confidenceStyle, type Severity } from "@/lib/trustColors";

export interface SignalItemData {
  key: string;
  label: string;
  value?: string | null;
  severity: Severity;
  confidence: string;
  source: string;
  explanation?: string | null;
}

export default function SignalItem({ signal }: { signal: SignalItemData }) {
  const [open, setOpen] = useState(false);
  const s = severityStyles[signal.severity];
  const conf = confidenceStyle(signal.confidence);

  return (
    <div className={`rounded-xl border ${s.border} ${s.bg}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${s.border} bg-white text-sm font-bold ${s.text}`}>
            {s.icon}
          </span>
          <span>
            <span className="block text-sm font-medium text-slate-900">{signal.label}</span>
            {signal.value && <span className="block text-xs text-slate-500">{signal.value}</span>}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className={`hidden rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline ${conf.bg} ${conf.text}`}>{signal.confidence}</span>
          <span className="text-slate-400">{open ? "−" : "+"}</span>
        </span>
      </button>
      {open && (
        <div className="tg-fade-up border-t border-slate-200/60 px-4 py-3 text-sm">
          <p className="font-medium text-slate-700">Why?</p>
          <p className="mt-1 text-slate-600">{signal.explanation || "No additional explanation is available for this signal."}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
            <div>
              <dt className="font-semibold text-slate-600">Source</dt>
              <dd>{signal.source}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-600">Confidence</dt>
              <dd>{signal.confidence}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
