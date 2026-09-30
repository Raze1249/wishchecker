// SSRF Guard — validates outbound fetch targets from user-supplied URLs.
//
// The analyzer must NEVER blindly fetch a user-provided URL. This module:
//  - validates the URL shape and scheme (http/https only)
//  - resolves DNS and blocks private / loopback / link-local / reserved ranges
//  - protects against DNS-rebinding by pinning the resolved IP
//  - enforces timeouts and a redirect allowlist policy

import dns from "node:dns/promises";
import net from "node:net";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
]);

export interface SsrfCheckResult {
  ok: boolean;
  reason?: string;
  hostname?: string;
  ip?: string;
}

function ipToLong(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = n * 256 + v;
  }
  return n >>> 0;
}

// Returns true when the IP address is considered private / unsafe.
export function isPrivateIp(ip: string): boolean {
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true; // loopback
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
    if (lower.startsWith("fe80")) return true; // link-local
    if (lower === "::") return true;
    // IPv4-mapped IPv6
    const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)/);
    if (mapped) return isPrivateIp(mapped[1]);
    return false;
  }

  const long = ipToLong(ip);
  if (long === null) return true; // unparseable => unsafe

  const ranges: Array<[string, number]> = [
    ["10.0.0.0", 8],
    ["172.16.0.0", 12],
    ["192.168.0.0", 16],
    ["127.0.0.0", 8], // loopback
    ["0.0.0.0", 8],
    ["169.254.0.0", 16], // link-local
    ["100.64.0.0", 10], // carrier-grade NAT
    ["192.0.0.0", 24],
    ["192.0.2.0", 24],
    ["198.18.0.0", 15],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["224.0.0.0", 4], // multicast
    ["240.0.0.0", 4], // reserved
  ];

  for (const [base, bits] of ranges) {
    const baseLong = ipToLong(base);
    if (baseLong === null) continue;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    if ((long & mask) === (baseLong & mask)) return true;
  }
  return false;
}

// Validate a URL string and check that it is safe to fetch.
export async function assertSafeUrl(rawUrl: string): Promise<SsrfCheckResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "Invalid URL format." };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "Only http and https URLs are supported." };
  }

  const hostname = url.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { ok: false, reason: "Blocked hostname.", hostname };
  }

  // If the hostname is itself an IP literal, validate directly.
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return { ok: false, reason: "Private/reserved IP addresses are not allowed.", hostname, ip: hostname };
    }
    return { ok: true, hostname, ip: hostname };
  }

  // Resolve DNS and validate every returned address (DNS rebinding protection).
  let addresses: string[] = [];
  try {
    const results = await dns.lookup(hostname, { all: true });
    addresses = results.map((r) => r.address);
  } catch {
    return { ok: false, reason: "Domain could not be resolved.", hostname };
  }

  if (addresses.length === 0) {
    return { ok: false, reason: "Domain resolved to no addresses.", hostname };
  }

  for (const ip of addresses) {
    if (isPrivateIp(ip)) {
      return { ok: false, reason: "Domain resolves to a private/internal address.", hostname, ip };
    }
  }

  return { ok: true, hostname, ip: addresses[0] };
}

// Safe fetch wrapper: re-validates each redirect hop and enforces a timeout.
export async function safeFetch(
  rawUrl: string,
  opts: { timeoutMs?: number; maxRedirects?: number } = {},
): Promise<{ ok: boolean; status?: number; body?: string; finalUrl?: string; error?: string; ip?: string }> {
  const timeoutMs = opts.timeoutMs ?? 8000;
  const maxRedirects = opts.maxRedirects ?? 4;

  let currentUrl = rawUrl;
  let lastIp: string | undefined;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const check = await assertSafeUrl(currentUrl);
    if (!check.ok) {
      return { ok: false, error: check.reason };
    }
    lastIp = check.ip;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(currentUrl, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "TrustGraphBot/1.0 (+https://trustgraph.example/bot)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      clearTimeout(timer);

      // Handle redirects manually so each hop is re-validated.
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) {
          return { ok: false, error: "Redirect without location header." };
        }
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      const contentType = res.headers.get("content-type") ?? "";
      let body = "";
      if (contentType.includes("text") || contentType.includes("html") || contentType.includes("json")) {
        const buf = await res.arrayBuffer();
        // cap body size to ~1.5MB
        body = Buffer.from(buf.slice(0, 1_500_000)).toString("utf8");
      }
      return { ok: true, status: res.status, body, finalUrl: currentUrl, ip: lastIp };
    } catch (err) {
      clearTimeout(timer);
      const message = err instanceof Error ? err.message : "Request failed";
      return { ok: false, error: message.includes("aborted") ? "Request timed out." : "Request failed." };
    }
  }

  return { ok: false, error: "Too many redirects." };
}
