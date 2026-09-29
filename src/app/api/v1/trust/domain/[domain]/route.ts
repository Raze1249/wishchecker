import { db } from "@/db";
import { sellers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSellerReport } from "@/server/reports/getReport";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const normalized = decodeURIComponent(domain).toLowerCase().replace(/^www\./, "");
  const rows = await db.select().from(sellers).where(eq(sellers.primaryDomain, normalized)).limit(1);
  const seller = rows[0];
  if (!seller) return Response.json({ error: "No analyzed seller found for this domain.", domain: normalized }, { status: 404 });

  const report = await getSellerReport(seller.id);
  if (!report) return Response.json({ error: "Not found." }, { status: 404 });

  return Response.json({
    seller: report.seller,
    risk: report.assessment ? { level: report.assessment.riskLevel, score: report.assessment.score, dimensions: report.assessment.riskDimensions } : null,
    confidence: report.assessment?.confidenceLevel ?? "Insufficient Data",
    signals: report.signals,
    relationships: report.relationships,
    customerExperience: report.reportStats,
    lastUpdated: report.seller.lastAnalyzed,
  });
}
