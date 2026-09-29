import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/auth";
import { db } from "@/db";
import { users, sellers, customerReports, trustAssessments, relationships, adminActions } from "@/db/schema";
import { sql, eq, desc } from "drizzle-orm";
import AdminModeration from "@/components/AdminModeration";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function countRows(table: any): Promise<number> {
  const r = await db.select({ c: sql<number>`count(*)` }).from(table);
  return Number(r[0]?.c ?? 0);
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Admin access required</h1>
        <p className="mt-2 text-sm text-slate-600">Your account does not have administrator permissions.</p>
      </div>
    );
  }

  const [totalUsers, totalSellers, totalReports, totalAnalyses, totalRelationships] = await Promise.all([
    countRows(users),
    countRows(sellers),
    countRows(customerReports),
    countRows(trustAssessments),
    countRows(relationships),
  ]);

  const pending = await db.select().from(customerReports).where(eq(customerReports.status, "pending")).orderBy(desc(customerReports.createdAt)).limit(50);
  const pendingWithSeller = [];
  for (const r of pending) {
    const s = (await db.select().from(sellers).where(eq(sellers.id, r.sellerId)).limit(1))[0];
    pendingWithSeller.push({
      id: r.id,
      sellerName: s?.name ?? "Unknown",
      sellerSlugId: s?.id,
      purchaseItem: r.purchaseItem,
      description: r.description,
      category: r.category,
      sentiment: r.sentiment,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    });
  }

  const audit = await db.select().from(adminActions).orderBy(desc(adminActions.createdAt)).limit(15);

  const stats = [
    { label: "Total users", value: totalUsers },
    { label: "Total sellers", value: totalSellers },
    { label: "Total reports", value: totalReports },
    { label: "Total analyses", value: totalAnalyses },
    { label: "Relationships", value: totalRelationships },
    { label: "Pending reports", value: pending.length },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Admin dashboard</h1>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">System: operational</span>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Moderation queue</h2>
        <p className="mb-4 text-sm text-slate-500">Approve legitimate reports, mark contested ones as disputed, or reject abusive content. Only approved reports affect trust profiles.</p>
        <AdminModeration initial={pendingWithSeller} />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Audit trail</h2>
        <div className="mt-3 space-y-1">
          {audit.length === 0 && <p className="text-sm text-slate-500">No administrative actions yet.</p>}
          {audit.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm">
              <span className="text-slate-700">{a.action} · {a.targetType}</span>
              <span className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
