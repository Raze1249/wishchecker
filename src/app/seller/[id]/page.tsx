import { notFound } from "next/navigation";
import Link from "next/link";
import { getSellerReport } from "@/server/reports/getReport";
import { getCurrentUser } from "@/server/auth/auth";
import { db } from "@/db";
import { monitoringSubscriptions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import TrustReport from "@/components/TrustReport";

export const dynamic = "force-dynamic";

export default async function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getSellerReport(id);
  if (!data) notFound();

  const user = await getCurrentUser();
  let isMonitoring = false;
  if (user) {
    const sub = await db
      .select()
      .from(monitoringSubscriptions)
      .where(and(eq(monitoringSubscriptions.userId, user.id), eq(monitoringSubscriptions.sellerId, id)))
      .limit(1);
    isMonitoring = sub.length > 0;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-4 flex items-center justify-between text-sm">
        <Link href="/search" className="text-slate-500 hover:text-slate-900">← Back to search</Link>
        <span className="text-xs text-slate-400">
          First observed {new Date(data.seller.firstObserved).toLocaleDateString()} · Last analyzed {new Date(data.seller.lastAnalyzed).toLocaleDateString()}
        </span>
      </div>
      {!data.assessment && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          This seller profile exists but has not been fully analyzed yet.{" "}
          <Link href={`/analyze?input=${encodeURIComponent(data.seller.primaryDomain ?? data.seller.name)}`} className="font-medium text-emerald-700 hover:underline">
            Run an analysis.
          </Link>
        </div>
      )}
      <TrustReport data={data} isAuthed={Boolean(user)} isMonitoring={isMonitoring} />
    </div>
  );
}
