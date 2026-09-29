// Demo data seeder for TrustGraph.
// Creates an admin user and clearly-labeled FICTIONAL demo sellers with
// user-style customer reports. Never contains claims about real businesses.
//
// Usage: node scripts/seed.mjs   (requires DATABASE_URL)

import crypto from "node:crypto";
import pg from "pg";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";
const pool = new Pool({ connectionString });

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

const uuid = () => crypto.randomUUID();
const rand = (p) => Math.random() < p;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  const client = await pool.connect();
  try {
    // ---- Admin user ----
    const adminEmail = "admin@trustgraph.dev";
    const adminPass = "TrustGraph#2026";
    await client.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE SET role = 'admin'`,
      [adminEmail, hashPassword(adminPass), "TrustGraph Admin"],
    );

    // ---- Demo seller: Demo Fashion Store ----
    await seedSeller(client, {
      name: "Demo Fashion Store",
      slug: "demo-fashion-store",
      domain: "demo-fashion.example",
      platforms: ["Website", "Instagram"],
      identity: "High",
      risk: "Moderate Risk",
      confidence: "High",
      positive: 8,
      warning: 4,
      unknown: 3,
      score: 42,
      social: { platform: "instagram", handle: "demo_fashion" },
      reports: buildReports(60, { received: 0.82, correct: 0.76, notDamaged: 0.88, refund: 0.61, supportGood: 0.69, requested: 0.32 }),
      history: ["Low Risk", "Low Risk", "Moderate Risk", "Moderate Risk"],
    });

    // ---- Demo seller: Demo Electronics ----
    await seedSeller(client, {
      name: "Demo Electronics",
      slug: "demo-electronics",
      domain: "demo-electronics.example",
      platforms: ["Website"],
      identity: "High",
      risk: "Low Risk",
      confidence: "Medium",
      positive: 10,
      warning: 1,
      unknown: 2,
      score: 14,
      reports: buildReports(28, { received: 0.95, correct: 0.9, notDamaged: 0.93, refund: 0.8, supportGood: 0.85, requested: 0.18 }),
      history: ["Low Risk", "Low Risk", "Low Risk"],
    });

    // ---- Demo seller: Demo Social Seller (insufficient info) ----
    await seedSeller(client, {
      name: "Demo Social Seller",
      slug: "demo-social-seller",
      domain: null,
      platforms: ["Instagram", "WhatsApp"],
      identity: "Insufficient Data",
      risk: "Insufficient Information",
      confidence: "Insufficient Data",
      positive: 1,
      warning: 0,
      unknown: 5,
      score: null,
      social: { platform: "instagram", handle: "demo_social_seller" },
      reports: [],
      history: ["Insufficient Information"],
    });

    console.log("\n✅ Seed complete.");
    console.log(`   Admin login: ${adminEmail} / ${adminPass}`);
    console.log("   Demo sellers: Demo Fashion Store, Demo Electronics, Demo Social Seller\n");
  } finally {
    client.release();
    await pool.end();
  }
}

function buildReports(n, p) {
  const reports = [];
  for (let i = 0; i < n; i++) {
    const received = rand(p.received);
    const correct = received && rand(p.correct);
    const damaged = received && !rand(p.notDamaged);
    const asDescribed = correct && rand(0.85);
    const requestedRefund = rand(p.requested);
    const receivedRefund = requestedRefund && rand(p.refund);
    const support = pick(rand(p.supportGood) ? ["Good"] : ["Average", "Poor"]);

    let category = "Positive experience";
    let description = "Smooth purchase, item arrived as expected and on time.";
    if (!received) { category = "Delivery"; description = "My order never arrived and tracking stopped updating."; }
    else if (damaged) { category = "Damaged product"; description = "The product arrived damaged in the packaging."; }
    else if (!correct) { category = "Wrong product"; description = "I received a different item than what I ordered."; }
    else if (requestedRefund && !receivedRefund) { category = "Refund"; description = "I requested a refund but have had difficulty getting it processed."; }
    else if (support === "Poor") { category = "Customer support"; description = "Customer support was slow to respond to my questions."; }

    const sentiment = category === "Positive experience" ? "Positive" : "Negative";
    reports.push({ received, correct, damaged, asDescribed, requestedRefund, receivedRefund, support, category, sentiment, description });
  }
  return reports;
}

async function seedSeller(client, cfg) {
  // Skip if slug already exists.
  const existing = await client.query("SELECT id FROM sellers WHERE slug = $1", [cfg.slug]);
  if (existing.rows.length > 0) {
    console.log(`   (skip) ${cfg.name} already seeded`);
    return;
  }

  const sellerId = uuid();
  await client.query(
    `INSERT INTO sellers (id, name, slug, primary_domain, platform_types, identity_confidence, is_demo, first_observed, last_analyzed)
     VALUES ($1,$2,$3,$4,$5,$6,true, now() - interval '120 days', now())`,
    [sellerId, cfg.name, cfg.slug, cfg.domain, JSON.stringify(cfg.platforms), cfg.identity],
  );

  if (cfg.domain) {
    await client.query(
      `INSERT INTO domains (seller_id, domain, https_enabled, source, confidence)
       VALUES ($1,$2,true,'website-analyzer','High')`,
      [sellerId, cfg.domain],
    );
  }
  if (cfg.social) {
    await client.query(
      `INSERT INTO social_accounts (seller_id, platform, handle, source, confidence)
       VALUES ($1,$2,$3,'user-input','Low')`,
      [sellerId, cfg.social.platform, cfg.social.handle],
    );
  }

  // Assessment
  const assessmentId = uuid();
  const dimensions = {
    seller: { label: "Seller Risk", level: cfg.risk, score: cfg.score ?? 0 },
    website: { label: "Website Risk", level: cfg.risk, score: cfg.score ?? 0 },
    purchase: { label: "Purchase Risk", level: cfg.risk, score: cfg.score ?? 0 },
    reputation: { label: "Reputation", level: cfg.risk, score: cfg.score ?? 0 },
    confidence: { label: "Information Confidence", level: cfg.confidence === "Insufficient Data" ? "Insufficient Information" : "Low Risk", score: 0 },
  };
  await client.query(
    `INSERT INTO trust_assessments (id, seller_id, risk_level, confidence_level, risk_dimensions, positive_count, warning_count, unknown_count, score, summary)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      assessmentId, sellerId, cfg.risk, cfg.confidence, JSON.stringify(dimensions),
      cfg.positive, cfg.warning, cfg.unknown, cfg.score,
      `Demo seller. Based on available evidence, this seller is currently assessed as ${cfg.risk.toLowerCase()} at ${cfg.confidence.toLowerCase()} confidence. This is an evidence-based assessment of risk, not a guarantee.`,
    ],
  );

  // A few representative signals
  const signals = [
    ["website", "https", "HTTPS / secure connection", "Present", "positive", "Medium", "TrustGraph website analyzer", "The site is served over HTTPS."],
    ["website", "refund_policy", "Refund policy", cfg.risk === "Low Risk" ? "Present" : "Absent", cfg.risk === "Low Risk" ? "positive" : "warning", "Medium", "TrustGraph website analyzer", cfg.risk === "Low Risk" ? "A refund policy was detected." : "No refund policy reference was found on the homepage."],
    ["seller", "identity_confidence", "Seller identity confidence", cfg.identity, cfg.identity === "High" ? "positive" : "unknown", cfg.identity, "TrustGraph entity resolution", `Identity resolved at ${cfg.identity.toLowerCase()} confidence.`],
    ["website", "domain_age", "Domain registration age", "Unknown", "unknown", "Insufficient Data", "TrustGraph website analyzer", "Domain registration age requires an authorized WHOIS provider and is not available in this build."],
  ];
  for (const s of signals) {
    await client.query(
      `INSERT INTO trust_signals (seller_id, assessment_id, category, key, label, value, severity, confidence, source, explanation)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [sellerId, assessmentId, s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7]],
    );
  }

  // Reports (approved so they count toward reputation)
  for (const r of cfg.reports) {
    await client.query(
      `INSERT INTO customer_reports (seller_id, purchase_item, purchase_channel, received, correct_product, damaged, as_described, requested_refund, received_refund, support_rating, description, category, sentiment, status, weight, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'approved',1, now() - (random()*interval '150 days'))`,
      [sellerId, "Demo item", pick(cfg.platforms), r.received, r.correct, r.damaged, r.asDescribed, r.requestedRefund, r.receivedRefund, r.support, r.description, r.category, r.sentiment],
    );
  }

  // History
  let d = cfg.history.length;
  for (const h of cfg.history) {
    await client.query(
      `INSERT INTO analysis_history (seller_id, risk_level, confidence_level, score, note, created_at)
       VALUES ($1,$2,$3,$4,'Demo historical observation', now() - ($5 || ' days')::interval)`,
      [sellerId, h, cfg.confidence, cfg.score, String(d * 30)],
    );
    d--;
  }

  console.log(`   ✓ Seeded ${cfg.name} (${cfg.reports.length} reports)`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
