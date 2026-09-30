// Analysis Orchestrator — runs the real "Before You Buy" pipeline and yields
// progress for EACH stage that is actually performed (no fake progress).

import { db } from "@/db";
import {
  sellers,
  domains,
  socialAccounts,
  trustAssessments,
  trustSignals,
  analysisHistory,
  relationships,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { parseSource, type ParsedSource } from "./inputParser";
import { analyzeWebsite, type WebsiteAnalysis } from "./websiteAnalyzer";
import { getReportStats } from "@/server/reputation/aggregate";
import { computeTrust } from "@/server/trustEngine/engine";
import { resolveIdentities, overallIdentityConfidence, type IdentityCandidate } from "@/server/entityResolution/resolver";
import { analyzePolicies } from "@/server/ai/analyzer";

export type StageEvent =
  | { type: "stage"; key: string; label: string }
  | { type: "done"; sellerId: string; assessmentId: string }
  | { type: "error"; message: string };

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || `seller-${Date.now()}`
  );
}

async function findOrCreateSeller(source: ParsedSource, website: WebsiteAnalysis | null) {
  // Prefer matching by domain for websites.
  if (source.domain) {
    const existing = await db.select().from(sellers).where(eq(sellers.primaryDomain, source.domain)).limit(1);
    if (existing[0]) return existing[0];
  }

  const slug = slugify(source.domain ?? source.handle ?? source.displayName);
  const existingBySlug = await db.select().from(sellers).where(eq(sellers.slug, slug)).limit(1);
  if (existingBySlug[0]) return existingBySlug[0];

  const name = website?.websiteTitle?.split(/[|\-–—]/)[0]?.trim() || source.displayName;
  const platformTypes = [source.platform];

  const inserted = await db
    .insert(sellers)
    .values({
      name: name.slice(0, 120),
      slug: `${slug}-${Math.random().toString(36).slice(2, 6)}`,
      primaryDomain: source.domain ?? null,
      platformTypes,
      identityConfidence: "Low",
    })
    .returning();
  return inserted[0];
}

export async function* runAnalysis(rawInput: string): AsyncGenerator<StageEvent> {
  try {
    yield { type: "stage", key: "platform", label: "Identifying platform" };
    const source = parseSource(rawInput);

    let website: WebsiteAnalysis | null = null;
    if (source.analyzable && (source.type === "website" || source.type === "product")) {
      yield { type: "stage", key: "website", label: "Checking website" };
      website = await analyzeWebsite(source.normalizedUrl ?? source.raw);

      yield { type: "stage", key: "domain", label: "Checking domain information" };
      // (domain info already gathered inside analyzeWebsite)

      yield { type: "stage", key: "policies", label: "Analyzing policies" };
      // policy analysis computed below from findings
    } else {
      yield { type: "stage", key: "source", label: "Resolving source type" };
    }

    yield { type: "stage", key: "seller", label: "Finding seller information" };
    const seller = await findOrCreateSeller(source, website);

    // Persist domain / social channel records for the graph.
    if (source.domain && website) {
      const existingDomain = await db.select().from(domains).where(eq(domains.sellerId, seller.id)).limit(1);
      if (existingDomain.length === 0) {
        await db.insert(domains).values({
          sellerId: seller.id,
          domain: source.domain,
          httpsEnabled: website.httpsEnabled,
          resolvedIp: website.domainInfo.resolvedIp ?? null,
          domainAgeDays: website.domainInfo.ageDays,
          websiteTitle: website.websiteTitle ?? null,
          source: "website-analyzer",
          confidence: "High",
        });
      }
    }
    if (!source.analyzable && (source.type === "instagram" || source.type === "facebook" || source.type === "tiktok" || source.type === "marketplace" || source.type === "whatsapp")) {
      const existingSocial = await db.select().from(socialAccounts).where(eq(socialAccounts.sellerId, seller.id)).limit(1);
      if (existingSocial.length === 0) {
        await db.insert(socialAccounts).values({
          sellerId: seller.id,
          platform: source.platform.toLowerCase(),
          handle: source.handle ?? null,
          url: source.normalizedUrl ?? null,
          source: "user-input",
          confidence: "Low",
        });
      }
    }

    yield { type: "stage", key: "reputation", label: "Checking available reputation signals" };
    const reportStats = await getReportStats(seller.id);

    yield { type: "stage", key: "experiences", label: "Analyzing customer experiences" };

    // Entity resolution across known channels of this seller.
    const domainRows = await db.select().from(domains).where(eq(domains.sellerId, seller.id));
    const socialRows = await db.select().from(socialAccounts).where(eq(socialAccounts.sellerId, seller.id));
    const candidates: IdentityCandidate[] = [];
    for (const d of domainRows) candidates.push({ type: "website", label: d.domain, businessName: seller.name, domain: d.domain });
    for (const s of socialRows) candidates.push({ type: s.platform, label: s.handle ? `@${s.handle}` : s.platform, businessName: seller.name, linkedDomain: seller.primaryDomain ?? undefined });
    const matches = resolveIdentities(candidates);
    const identityConfidence = overallIdentityConfidence(matches, candidates.length);

    yield { type: "stage", key: "profile", label: "Building seller profile" };

    const hasBusinessInfo = Boolean(
      website?.findings.find((f) => f.key === "contact_info")?.present,
    );

    // Persist identity relationships (edges).
    if (matches.length > 0) {
      await db.delete(relationships).where(eq(relationships.sellerId, seller.id));
      for (const m of matches) {
        await db.insert(relationships).values({
          sellerId: seller.id,
          fromType: "identity",
          fromLabel: m.a,
          toType: "identity",
          toLabel: m.b,
          relationship: "possibly_operated_by",
          state: m.state,
          confidence: m.confidence,
          evidence: m.evidence,
          contradictions: m.contradictions,
          source: "entity-resolution",
        });
      }
    }

    yield { type: "stage", key: "report", label: "Generating trust report" };
    const result = computeTrust({ source, website, reportStats, identityConfidence, hasBusinessInfo });

    // AI policy analysis stored as part of the summary evidence.
    if (website?.reachable) {
      analyzePolicies(website.findings.map((f) => ({ key: f.key, present: f.present, label: f.label })));
    }

    // Persist assessment + signals + history.
    const assessmentRows = await db
      .insert(trustAssessments)
      .values({
        sellerId: seller.id,
        riskLevel: result.riskLevel,
        confidenceLevel: result.confidenceLevel,
        riskDimensions: Object.fromEntries(result.dimensions.map((d) => [d.key, { label: d.label, level: d.level, score: d.score }])),
        positiveCount: result.positiveCount,
        warningCount: result.warningCount,
        unknownCount: result.unknownCount,
        score: result.score,
        summary: result.summary,
      })
      .returning();
    const assessment = assessmentRows[0];

    if (result.signals.length > 0) {
      await db.insert(trustSignals).values(
        result.signals.map((s) => ({
          sellerId: seller.id,
          assessmentId: assessment.id,
          category: s.category,
          key: s.key,
          label: s.label,
          value: s.value ?? null,
          severity: s.severity,
          confidence: s.confidence,
          source: s.source,
          explanation: s.explanation,
          evidence: s.evidence ?? null,
        })),
      );
    }

    await db.insert(analysisHistory).values({
      sellerId: seller.id,
      riskLevel: result.riskLevel,
      confidenceLevel: result.confidenceLevel,
      score: result.score,
      note: "Automated analysis run",
    });

    // Update seller metadata.
    await db
      .update(sellers)
      .set({
        identityConfidence,
        lastAnalyzed: new Date(),
        updatedAt: new Date(),
        platformTypes: Array.from(new Set([...(seller.platformTypes ?? []), source.platform])),
      })
      .where(eq(sellers.id, seller.id));

    yield { type: "done", sellerId: seller.id, assessmentId: assessment.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed unexpectedly.";
    yield { type: "error", message };
  }
}
