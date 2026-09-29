import { getCurrentUser } from "@/server/auth/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  return Response.json({ user });
}
