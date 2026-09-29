import { db } from "@/db";
import { analysisHistory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ sellerId: string }> }) {
  const { sellerId } = await params;
  const rows = await db
    .select()
    .from(analysisHistory)
    .where(eq(analysisHistory.sellerId, sellerId))
    .orderBy(desc(analysisHistory.createdAt))
    .limit(50);
  return Response.json({ history: rows });
}
