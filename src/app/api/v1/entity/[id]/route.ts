import { db } from "@/db";
import { sellers, domains, socialAccounts, relationships, products } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(sellers).where(eq(sellers.id, id)).limit(1);
  const seller = rows[0];
  if (!seller) return Response.json({ error: "Entity not found." }, { status: 404 });

  const [domainRows, socialRows, relRows, productRows] = await Promise.all([
    db.select().from(domains).where(eq(domains.sellerId, id)),
    db.select().from(socialAccounts).where(eq(socialAccounts.sellerId, id)),
    db.select().from(relationships).where(eq(relationships.sellerId, id)),
    db.select().from(products).where(eq(products.sellerId, id)),
  ]);

  return Response.json({
    entity: seller,
    nodes: {
      domains: domainRows,
      socialAccounts: socialRows,
      products: productRows,
    },
    relationships: relRows,
  });
}
