import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, setSessionCookie } from "@/server/auth/auth";
import { rateLimit, getClientIp } from "@/server/security/rateLimit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`register:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) return Response.json({ error: "Too many attempts. Try again later." }, { status: 429 });

  let body: { email?: string; password?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const name = (body.name ?? "").trim();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ error: "A valid email is required." }, { status: 400 });
  if (password.length < 8) return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  if (name.length < 2) return Response.json({ error: "Please provide your name." }, { status: 400 });

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) return Response.json({ error: "An account with this email already exists." }, { status: 409 });

  const inserted = await db
    .insert(users)
    .values({ email, name, passwordHash: hashPassword(password) })
    .returning();
  const user = inserted[0];

  await setSessionCookie(user.id);
  return Response.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}
