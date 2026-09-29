import { db } from "@/db";
import { sellers, domains, socialAccounts } from "@/db/schema";
import { ilike, or, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q || q.length < 2) return Response.json({ results: [] });

  const like = `%${q}%`;

  const sellerRows = await db
    .select()
    .from(sellers)
    .where(or(ilike(sellers.name, like), ilike(sellers.slug, like), ilike(sellers.primaryDomain, like)))
    .orderBy(desc(sellers.lastAnalyzed))
    .limit(20);

  // Also match via domain / social handle -> map back to seller ids
  const domainMatches = await db.select().from(domains).where(ilike(domains.domain, like)).limit(20);
  const socialMatches = await db.select().from(socialAccounts).where(ilike(socialAccounts.handle, like)).limit(20);

  const extraIds = new Set<string>([...domainMatches.map((d) => d.sellerId), ...socialMatches.map((s) => s.sellerId)]);
  const alreadyHave = new Set(sellerRows.map((s) => s.id));
  const missing = [...extraIds].filter((id) => !alreadyHave.has(id));

  let extraSellers: typeof sellerRows = [];
  if (missing.length > 0) {
    const all = await db.select().from(sellers).orderBy(desc(sellers.lastAnalyzed)).limit(100);
    extraSellers = all.filter((s) => missing.includes(s.id));
  }

  const results = [...sellerRows, ...extraSellers].map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    domain: s.primaryDomain,
    platforms: s.platformTypes,
    identityConfidence: s.identityConfidence,
    isDemo: s.isDemo,
  }));

  return Response.json({ results });
}
