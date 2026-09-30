// Lightweight trust-graph visualization (CSS/SVG, no heavy deps).
// Shows the seller node connected to its channels, products and reports.

interface GraphNode {
  label: string;
  type: string;
}

export default function TrustGraphViz({
  sellerName,
  channels,
  productCount,
  reportCount,
}: {
  sellerName: string;
  channels: GraphNode[];
  productCount: number;
  reportCount: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-col items-center">
        <div className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
          {sellerName}
        </div>
        <div className="h-6 w-px bg-slate-300" />
        <div className="flex flex-wrap items-start justify-center gap-4">
          {channels.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-400">
              No channels linked yet
            </div>
          )}
          {channels.map((c, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="h-4 w-px bg-slate-300" />
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{c.type}</div>
                <div className="text-xs font-medium text-slate-700">{c.label}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 h-6 w-px bg-slate-300" />
        <div className="flex gap-4">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
            <div className="text-lg font-semibold text-slate-900">{productCount}</div>
            <div className="text-[11px] text-slate-500">Products</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
            <div className="text-lg font-semibold text-slate-900">{reportCount}</div>
            <div className="text-[11px] text-slate-500">Customer reports</div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">
        Nodes and edges carry confidence + evidence. Connections shown as &quot;possible&quot; are not asserted as fact.
      </p>
    </div>
  );
}
