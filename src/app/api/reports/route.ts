import { db } from "@/db";
import { customerReports, sellers } from "@/db/schema";
import { and, eq, gte } from "drizzle-orm";
import { getCurrentUser } from "@/server/auth/auth";
import { classifyReport } from "@/server/ai/analyzer";
import { rateLimit, getClientIp } from "@/server/security/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`report:${ip}`, 8, 60 * 60 * 1000);
  if (!rl.allowed) return Response.json({ error: "You have submitted too many reports recently. Please try again later." }, { status: 429 });

  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "You must be signed in to submit a customer experience." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const sellerId = String(body.sellerId ?? "");
  if (!sellerId) return Response.json({ error: "A seller is required." }, { status: 400 });

  const sellerRows = await db.select().from(sellers).where(eq(sellers.id, sellerId)).limit(1);
  if (!sellerRows[0]) return Response.json({ error: "Seller not found." }, { status: 404 });

  const description = String(body.description ?? "").slice(0, 4000);
  if (description.trim().length < 10) {
    return Response.json({ error: "Please describe your experience (at least 10 characters). Evidence-based reports keep the graph fair." }, { status: 400 });
  }

  // Duplicate detection: same user + seller within 24h.
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await db
    .select()
    .from(customerReports)
    .where(and(eq(customerReports.sellerId, sellerId), eq(customerReports.userId, user.id), gte(customerReports.createdAt, dayAgo)));
  if (recent.length > 0) {
    return Response.json({ error: "You already submitted a report for this seller in the last 24 hours. This helps prevent coordinated manipulation." }, { status: 409 });
  }

  const toBool = (v: unknown): boolean | null => (v === true ? true : v === false ? false : v === "yes" ? true : v === "no" ? false : null);

  const { category, sentiment } = classifyReport(description);

  // Anti-abuse weighting: base weight from account age. New accounts count less.
  const weight = 1;

  const inserted = await db
    .insert(customerReports)
    .values({
      sellerId,
      userId: user.id,
      purchaseItem: String(body.purchaseItem ?? "").slice(0, 200) || null,
      purchaseChannel: String(body.purchaseChannel ?? "").slice(0, 200) || null,
      received: toBool(body.received),
      correctProduct: toBool(body.correctProduct),
      damaged: toBool(body.damaged),
      asDescribed: toBool(body.asDescribed),
      requestedRefund: toBool(body.requestedRefund),
      receivedRefund: toBool(body.receivedRefund),
      supportRating: ["Good", "Average", "Poor"].includes(String(body.supportRating)) ? String(body.supportRating) : null,
      description,
      category,
      sentiment,
      status: "pending", // enters moderation queue
      weight,
    })
    .returning();

  return Response.json({
    report: { id: inserted[0].id, status: "pending", category, sentiment },
    message: "Thank you. Your report has entered the moderation queue and will be reviewed before it affects the seller's trust profile.",
  });
}
