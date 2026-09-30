// Reputation aggregation — turns approved customer reports into category stats.
// Only APPROVED reports are counted, and each report contributes its
// anti-abuse weight so coordinated / low-trust reports cannot dominate.

import { db } from "@/db";
import { customerReports } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { ReportStats } from "@/server/trustEngine/types";

function positivePct(items: Array<{ good: boolean | null; weight: number }>): number | null {
  const valid = items.filter((i) => i.good !== null);
  if (valid.length === 0) return null;
  const totalW = valid.reduce((a, i) => a + i.weight, 0);
  const goodW = valid.filter((i) => i.good).reduce((a, i) => a + i.weight, 0);
  if (totalW === 0) return null;
  return Math.round((goodW / totalW) * 100);
}

export async function getReportStats(sellerId: string): Promise<ReportStats> {
  const rows = await db
    .select()
    .from(customerReports)
    .where(and(eq(customerReports.sellerId, sellerId), eq(customerReports.status, "approved")));

  if (rows.length === 0) {
    return {
      total: 0,
      deliveryPositivePct: null,
      productAccuracyPct: null,
      conditionPositivePct: null,
      refundPositivePct: null,
      supportPositivePct: null,
      commonIssues: [],
    };
  }

  const w = (b: boolean | null, weight: number) => ({ good: b, weight });

  const delivery = positivePct(rows.map((r) => w(r.received, r.weight)));
  const accuracy = positivePct(rows.map((r) => w(r.correctProduct === null ? null : r.correctProduct && (r.asDescribed ?? true), r.weight)));
  const condition = positivePct(rows.map((r) => w(r.damaged === null ? null : !r.damaged, r.weight)));
  // Refund experience only among those who requested a refund.
  const refundRows = rows.filter((r) => r.requestedRefund === true);
  const refund = refundRows.length ? positivePct(refundRows.map((r) => w(r.receivedRefund, r.weight))) : null;
  const support = positivePct(
    rows.map((r) => w(r.supportRating === null ? null : r.supportRating === "Good" ? true : r.supportRating === "Poor" ? false : null, r.weight)),
  );

  // Common issues from AI category labels of negative-ish reports.
  const issueCounts = new Map<string, number>();
  for (const r of rows) {
    if (r.category && r.category !== "Positive experience" && r.category !== "Other") {
      issueCounts.set(r.category, (issueCounts.get(r.category) ?? 0) + 1);
    }
  }
  const commonIssues = [...issueCounts.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);

  return {
    total: rows.length,
    deliveryPositivePct: delivery,
    productAccuracyPct: accuracy,
    conditionPositivePct: condition,
    refundPositivePct: refund,
    supportPositivePct: support,
    commonIssues,
  };
}
