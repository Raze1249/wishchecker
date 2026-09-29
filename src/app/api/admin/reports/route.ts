import { db } from "@/db";
import { customerReports, adminActions, sellers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/server/auth/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "pending";
  const rows = await db.select().from(customerReports).where(eq(customerReports.status, status)).orderBy(desc(customerReports.createdAt)).limit(100);

  const withSeller = [];
  for (const r of rows) {
    const s = (await db.select().from(sellers).where(eq(sellers.id, r.sellerId)).limit(1))[0];
    withSeller.push({ ...r, sellerName: s?.name ?? "Unknown", sellerSlugId: s?.id });
  }
  return Response.json({ reports: withSeller });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const reportId = String(body.reportId ?? "");
  const action = String(body.action ?? ""); // approve | reject | dispute
  if (!reportId || !["approve", "reject", "dispute"].includes(action)) {
    return Response.json({ error: "Invalid moderation action." }, { status: 400 });
  }

  const statusMap: Record<string, string> = { approve: "approved", reject: "rejected", dispute: "disputed" };
  await db.update(customerReports).set({ status: statusMap[action] }).where(eq(customerReports.id, reportId));
  await db.insert(adminActions).values({
    adminId: user.id,
    action: `report_${action}`,
    targetType: "customer_report",
    targetId: reportId,
    note: String(body.note ?? "").slice(0, 500) || null,
  });

  return Response.json({ ok: true });
}
