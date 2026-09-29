import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth/auth";
import { db } from "@/db";
import { customerReports, monitoringSubscriptions, sellers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const [reports, subs] = await Promise.all([
    db.select().from(customerReports).where(eq(customerReports.userId, user.id)).orderBy(desc(customerReports.createdAt)).limit(20),
    db.select().from(monitoringSubscriptions).where(eq(monitoringSubscriptions.userId, user.id)),
  ]);

  const monitored = [];
  for (const s of subs) {
    const seller = (await db.select().from(sellers).where(eq(sellers.id, s.sellerId)).limit(1))[0];
    if (seller) monitored.push(seller);
  }

  const statusStyle: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-slate-200 text-slate-600",
    disputed: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Welcome, {user.name}</h1>
      <p className="mt-1 text-sm text-slate-500">{user.email}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="text-2xl font-bold">{reports.length}</div><div className="text-xs text-slate-500">Your reports</div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="text-2xl font-bold">{monitored.length}</div><div className="text-xs text-slate-500">Monitored sellers</div></div>
        <Link href="/analyze" className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white hover:bg-slate-800"><div className="text-lg font-semibold">Analyze a source →</div><div className="text-xs text-slate-300">Start a new trust report</div></Link>
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Monitored sellers</h2>
          <Link href="/monitoring" className="text-sm font-medium text-emerald-700 hover:underline">Manage →</Link>
        </div>
        {monitored.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">You aren&apos;t monitoring any sellers yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {monitored.map((s) => (
              <Link key={s.id} href={`/seller/${s.id}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm">
                <span className="font-medium text-slate-800">{s.name}</span>
                <span className="text-xs text-slate-400">{s.primaryDomain}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Your submitted experiences</h2>
        {reports.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            You haven&apos;t submitted any experiences.{" "}
            <Link href="/report-experience" className="font-medium text-emerald-700 hover:underline">Share one.</Link>
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">{r.purchaseItem || "Purchase experience"}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusStyle[r.status] ?? "bg-slate-100"}`}>{r.status}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{r.description}</p>
                {r.category && <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">{r.category} · {r.sentiment}</span>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
