import AnalyzeInput from "@/components/AnalyzeInput";
import AnalyzeRunner from "@/components/AnalyzeRunner";

export const dynamic = "force-dynamic";

export default async function AnalyzePage({ searchParams }: { searchParams: Promise<{ input?: string }> }) {
  const { input } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Before You Buy</h1>
      <p className="mt-2 text-sm text-slate-600">
        Enter a shopping source and we&apos;ll build an evidence-based Purchase Trust Report.
      </p>

      <div className="mt-6">
        <AnalyzeInput autoFocus={!input} />
      </div>

      {input && (
        <div className="mt-8">
          <AnalyzeRunner input={input} />
        </div>
      )}

      {!input && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          <p className="font-medium text-slate-700">Examples you can try:</p>
          <ul className="mt-2 space-y-1">
            <li>• A store website like <code>example-shop.com</code></li>
            <li>• A product link</li>
            <li>• An Instagram profile like <code>@a_seller</code> (identity resolution only)</li>
          </ul>
          <p className="mt-3 text-xs text-slate-400">
            For social and messaging sellers we do not scrape platform content; we resolve identity and rely on
            user-submitted evidence.
          </p>
        </div>
      )}
    </div>
  );
}
