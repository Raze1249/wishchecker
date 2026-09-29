import { db } from "@/db";
import { monitoringSubscriptions, sellers, trustAssessments } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/server/auth/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const subs = await db.select().from(monitoringSubscriptions).where(eq(monitoringSubscriptions.userId, user.id));
  const items = [];
  for (const sub of subs) {
    const s = (await db.select().from(sellers).where(eq(sellers.id, sub.sellerId)).limit(1))[0];
    if (!s) continue;
    const latest = (await db.select().from(trustAssessments).where(eq(trustAssessments.sellerId, s.id)).orderBy(desc(trustAssessments.createdAt)).limit(1))[0];
    items.push({ subscriptionId: sub.id, seller: s, latest: latest ?? null });
  }
  return Response.json({ items });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const sellerId = String(body.sellerId ?? "");
  if (!sellerId) return Response.json({ error: "sellerId required" }, { status: 400 });

  const existing = await db
    .select()
    .from(monitoringSubscriptions)
    .where(and(eq(monitoringSubscriptions.userId, user.id), eq(monitoringSubscriptions.sellerId, sellerId)))
    .limit(1);
  if (existing[0]) return Response.json({ ok: true, alreadyMonitoring: true });

  await db.insert(monitoringSubscriptions).values({ userId: user.id, sellerId });
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const sellerId = url.searchParams.get("sellerId") ?? "";
  if (!sellerId) return Response.json({ error: "sellerId required" }, { status: 400 });
  await db
    .delete(monitoringSubscriptions)
    .where(and(eq(monitoringSubscriptions.userId, user.id), eq(monitoringSubscriptions.sellerId, sellerId)));
  return Response.json({ ok: true });
}
