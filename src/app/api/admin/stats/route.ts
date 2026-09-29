import { db } from "@/db";
import { users, sellers, customerReports, trustAssessments, relationships } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { getCurrentUser } from "@/server/auth/auth";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function count(table: any): Promise<number> {
  const r = await db.select({ c: sql<number>`count(*)` }).from(table);
  return Number(r[0]?.c ?? 0);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

  const [totalUsers, totalSellers, totalReports, totalAnalyses, totalRelationships] = await Promise.all([
    count(users),
    count(sellers),
    count(customerReports),
    count(trustAssessments),
    count(relationships),
  ]);

  const pending = await db.select({ c: sql<number>`count(*)` }).from(customerReports).where(eq(customerReports.status, "pending"));
  const disputed = await db.select({ c: sql<number>`count(*)` }).from(customerReports).where(eq(customerReports.status, "disputed"));

  return Response.json({
    totalUsers,
    totalSellers,
    totalReports,
    totalAnalyses,
    totalRelationships,
    pendingReports: Number(pending[0]?.c ?? 0),
    disputedReports: Number(disputed[0]?.c ?? 0),
    systemHealth: "operational",
  });
}
