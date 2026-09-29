import { clearSessionCookie } from "@/server/auth/auth";

export async function POST() {
  await clearSessionCookie();
  return Response.json({ ok: true });
}
