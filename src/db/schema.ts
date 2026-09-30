// TrustGraph — Universal Shopping Trust Infrastructure
// Drizzle ORM schema (PostgreSQL).
//
// Every important object carries createdAt / updatedAt and, where relevant,
// `source` and `confidence` so the trust graph stays explainable.

import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Users & auth
// ---------------------------------------------------------------------------
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"), // user | admin
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Sellers (the central node of the trust graph)
// ---------------------------------------------------------------------------
export const sellers = pgTable(
  "sellers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    primaryDomain: text("primary_domain"),
    // channels the seller appears to operate through
    platformTypes: jsonb("platform_types").$type<string[]>().notNull().default([]),
    identityConfidence: text("identity_confidence").notNull().default("Low"), // High | Medium | Low | Insufficient Data
    isDemo: boolean("is_demo").notNull().default(false),
    firstObserved: timestamp("first_observed").notNull().defaultNow(),
    lastAnalyzed: timestamp("last_analyzed").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("sellers_name_idx").on(t.name)],
);

// ---------------------------------------------------------------------------
// Domains
// ---------------------------------------------------------------------------
export const domains = pgTable("domains", {
  id: uuid("id").defaultRandom().primaryKey(),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  httpsEnabled: boolean("https_enabled"),
  resolvedIp: text("resolved_ip"),
  domainAgeDays: integer("domain_age_days"),
  websiteTitle: text("website_title"),
  source: text("source").notNull().default("website-analyzer"),
  confidence: text("confidence").notNull().default("Medium"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Social / marketplace accounts
// ---------------------------------------------------------------------------
export const socialAccounts = pgTable("social_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // instagram | facebook | tiktok | whatsapp | marketplace
  handle: text("handle"),
  url: text("url"),
  source: text("source").notNull().default("user-input"),
  confidence: text("confidence").notNull().default("Low"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url"),
  price: text("price"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Trust assessments (a point-in-time evaluation)
// ---------------------------------------------------------------------------
export const trustAssessments = pgTable("trust_assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  riskLevel: text("risk_level").notNull(), // Low Risk | Moderate Risk | Elevated Risk | High Risk | Insufficient Information
  confidenceLevel: text("confidence_level").notNull(), // High | Medium | Low | Insufficient Data
  riskDimensions: jsonb("risk_dimensions").$type<Record<string, { label: string; level: string; score: number }>>().notNull().default({}),
  positiveCount: integer("positive_count").notNull().default(0),
  warningCount: integer("warning_count").notNull().default(0),
  unknownCount: integer("unknown_count").notNull().default(0),
  score: integer("score"),
  summary: text("summary"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Trust signals (the evidence-first building blocks)
// ---------------------------------------------------------------------------
export const trustSignals = pgTable("trust_signals", {
  id: uuid("id").defaultRandom().primaryKey(),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  assessmentId: uuid("assessment_id").references(() => trustAssessments.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // seller | website | purchase | reputation | confidence
  key: text("key").notNull(),
  label: text("label").notNull(),
  value: text("value"),
  severity: text("severity").notNull(), // positive | warning | unknown
  confidence: text("confidence").notNull().default("Medium"),
  source: text("source").notNull(),
  explanation: text("explanation"),
  evidence: jsonb("evidence").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Customer reports (user-submitted experiences)
// ---------------------------------------------------------------------------
export const customerReports = pgTable("customer_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  purchaseItem: text("purchase_item"),
  purchaseChannel: text("purchase_channel"),
  received: boolean("received"),
  correctProduct: boolean("correct_product"),
  damaged: boolean("damaged"),
  asDescribed: boolean("as_described"),
  requestedRefund: boolean("requested_refund"),
  receivedRefund: boolean("received_refund"),
  supportRating: text("support_rating"), // Good | Average | Poor
  description: text("description"),
  category: text("category"), // AI classification
  sentiment: text("sentiment"), // AI sentiment
  status: text("status").notNull().default("pending"), // pending | approved | rejected | disputed
  weight: integer("weight").notNull().default(1), // confidence weighting for anti-abuse
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Relationships (edges of the trust graph)
// ---------------------------------------------------------------------------
export const relationships = pgTable("relationships", {
  id: uuid("id").defaultRandom().primaryKey(),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  fromType: text("from_type").notNull(),
  fromLabel: text("from_label").notNull(),
  toType: text("to_type").notNull(),
  toLabel: text("to_label").notNull(),
  relationship: text("relationship").notNull(), // owned_by | linked_to | sells | reported_by | associated_with | possibly_operated_by
  state: text("state").notNull().default("Unknown"), // Verified | High confidence | Possible | Unknown | Disputed
  confidence: integer("confidence").notNull().default(0), // 0-100
  evidence: jsonb("evidence").$type<string[]>().notNull().default([]),
  contradictions: jsonb("contradictions").$type<string[]>().notNull().default([]),
  source: text("source").notNull().default("entity-resolution"),
  lastVerified: timestamp("last_verified").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Analysis history (historical trust)
// ---------------------------------------------------------------------------
export const analysisHistory = pgTable("analysis_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  riskLevel: text("risk_level").notNull(),
  confidenceLevel: text("confidence_level").notNull(),
  score: integer("score"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Monitoring subscriptions
// ---------------------------------------------------------------------------
export const monitoringSubscriptions = pgTable("monitoring_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Admin actions (audit trail)
// ---------------------------------------------------------------------------
export const adminActions = pgTable("admin_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminId: uuid("admin_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
