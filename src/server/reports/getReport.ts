// Shared report assembly — used by the v1 API and by server-rendered pages.

import { db } from "@/db";
import {
  sellers,
  domains,
  socialAccounts,
  trustAssessments,
  trustSignals,
  relationships,
  analysisHistory,
  products,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getReportStats } from "@/server/reputation/aggregate";
import { summarizeExperience } from "@/server/ai/analyzer";

export async function getSellerReport(sellerId: string) {
  const sellerRows = await db.select().from(sellers).where(eq(sellers.id, sellerId)).limit(1);
  const seller = sellerRows[0];
  if (!seller) return null;

  const [assessmentRows, domainRows, socialRows, relRows, historyRows, productRows] = await Promise.all([
    db.select().from(trustAssessments).where(eq(trustAssessments.sellerId, sellerId)).orderBy(desc(trustAssessments.createdAt)).limit(1),
    db.select().from(domains).where(eq(domains.sellerId, sellerId)),
    db.select().from(socialAccounts).where(eq(socialAccounts.sellerId, sellerId)),
    db.select().from(relationships).where(eq(relationships.sellerId, sellerId)),
    db.select().from(analysisHistory).where(eq(analysisHistory.sellerId, sellerId)).orderBy(desc(analysisHistory.createdAt)).limit(12),
    db.select().from(products).where(eq(products.sellerId, sellerId)),
  ]);

  const assessment = assessmentRows[0] ?? null;
  const signals = assessment
    ? await db.select().from(trustSignals).where(eq(trustSignals.assessmentId, assessment.id))
    : [];

  const reportStats = await getReportStats(sellerId);
  const experienceSummary = summarizeExperience({
    total: reportStats.total,
    deliveryPositivePct: reportStats.deliveryPositivePct,
    refundPositivePct: reportStats.refundPositivePct,
    productAccuracyPct: reportStats.productAccuracyPct,
    supportPositivePct: reportStats.supportPositivePct,
  });

  return {
    seller,
    assessment,
    signals,
    domains: domainRows,
    socialAccounts: socialRows,
    relationships: relRows,
    history: historyRows,
    products: productRows,
    reportStats,
    experienceSummary,
  };
}

export async function getReportByAssessment(assessmentId: string) {
  const rows = await db.select().from(trustAssessments).where(eq(trustAssessments.id, assessmentId)).limit(1);
  const assessment = rows[0];
  if (!assessment) return null;
  return getSellerReport(assessment.sellerId);
}
