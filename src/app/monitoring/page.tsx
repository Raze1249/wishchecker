import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth/auth";
import { db } from "@/db";
import { monitoringSubscriptions, sellers, trustAssessments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { riskStyle } from "@/lib/trustColors";

export const dynamic = "force-dynamic";

export default async function MonitoringPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/monitoring");

  const subs = await db.select().from(monitoringSubscriptions).where(eq(monitoringSubscriptions.userId, user.id));
  const items = [];
  for (const sub of subs) {
    const seller = (await db.select().from(sellers).where(eq(sellers.id, sub.sellerId)).limit(1))[0];
    if (!seller) continue;
    const latest = (await db.select().from(trustAssessments).where(eq(trustAssessments.sellerId, seller.id)).orderBy(desc(trustAssessments.createdAt)).limit(1))[0];
    items.push({ seller, latest });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Monitored sellers</h1>
      <p className="mt-2 text-sm text-slate-600">
        We periodically re-check permitted signals and notify you when significant changes occur — such as a change in risk
        profile, an increase in customer complaints, or a website change. Only meaningful changes are surfaced.
      </p>

      <div className="mt-8 space-y-3">
        {items.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            You aren&apos;t monitoring any sellers yet. Open any seller profile and choose &quot;Monitor this seller&quot;.
          </div>
        )}
        {items.map(({ seller, latest }) => {
          const rs = riskStyle(latest?.riskLevel ?? "Insufficient Information");
          return (
            <Link key={seller.id} href={`/seller/${seller.id}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm">
              <div>
                <div className="font-medium text-slate-800">{seller.name}</div>
                <div className="text-xs text-slate-400">{seller.primaryDomain}</div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${rs.bg} ${rs.text}`}>{latest?.riskLevel ?? "Insufficient Information"}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
