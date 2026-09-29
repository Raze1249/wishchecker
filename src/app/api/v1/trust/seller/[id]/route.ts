import { getSellerReport } from "@/server/reports/getReport";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getSellerReport(id);
  if (!report) return Response.json({ error: "Seller not found." }, { status: 404 });

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
