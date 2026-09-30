import { notFound } from "next/navigation";
import Link from "next/link";
import { getReportByAssessment } from "@/server/reports/getReport";
import { getCurrentUser } from "@/server/auth/auth";
import { db } from "@/db";
import { monitoringSubscriptions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import TrustReport from "@/components/TrustReport";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getReportByAssessment(id);
  if (!data) notFound();

  const user = await getCurrentUser();
  let isMonitoring = false;
  if (user) {
    const sub = await db
      .select()
      .from(monitoringSubscriptions)
      .where(and(eq(monitoringSubscriptions.userId, user.id), eq(monitoringSubscriptions.sellerId, data.seller.id)))
      .limit(1);
    isMonitoring = sub.length > 0;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-4 flex items-center justify-between text-sm">
        <Link href="/analyze" className="text-slate-500 hover:text-slate-900">← Analyze another source</Link>
        <Link href={`/seller/${data.seller.id}`} className="font-medium text-emerald-700 hover:underline">View full seller profile →</Link>
      </div>
      <TrustReport data={data} isAuthed={Boolean(user)} isMonitoring={isMonitoring} />
    </div>
  );
}
