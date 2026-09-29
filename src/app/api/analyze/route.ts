import { runAnalysis } from "@/server/analyzer/orchestrator";
import { rateLimit, getClientIp } from "@/server/security/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Streams newline-delimited JSON stage events so the UI can show real progress.
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`analyze:${ip}`, 20, 10 * 60 * 1000);
  if (!rl.allowed) {
    return Response.json({ error: "Rate limit exceeded. Please wait before analyzing again." }, { status: 429 });
  }

  let body: { input?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const input = (body.input ?? "").trim();
  if (!input || input.length > 2048) {
    return Response.json({ error: "Please provide a valid shopping source." }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of runAnalysis(input)) {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Analysis failed.";
        controller.enqueue(encoder.encode(JSON.stringify({ type: "error", message }) + "\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
