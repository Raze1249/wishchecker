import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, setSessionCookie } from "@/server/auth/auth";
import { rateLimit, getClientIp } from "@/server/security/rateLimit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`login:${ip}`, 15, 15 * 60 * 1000);
  if (!rl.allowed) return Response.json({ error: "Too many attempts. Try again later." }, { status: 429 });

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  // Constant-ish response to avoid user enumeration.
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return Response.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await setSessionCookie(user.id);
  return Response.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}
