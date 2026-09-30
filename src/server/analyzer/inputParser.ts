// Universal Input Parser — normalizes an arbitrary shopping source into a
// structured descriptor. This is the entry point for the adapter architecture:
//
//   InputAdapter
//   ├── WebsiteAdapter
//   ├── InstagramAdapter
//   ├── FacebookAdapter
//   ├── TikTokAdapter
//   ├── MarketplaceAdapter
//   ├── ProductAdapter
//   ├── MessagingAdapter (WhatsApp)
//   └── QRAdapter (future)
//
// We only *fully* analyze sources that can be legally & technically accessed
// (currently: public websites). Social / messaging sources are detected and
// resolved to a seller shell with an honest "insufficient information" posture.

export type SourceType =
  | "website"
  | "product"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "whatsapp"
  | "marketplace"
  | "unknown";

export interface ParsedSource {
  type: SourceType;
  platform: string;
  raw: string;
  normalizedUrl?: string;
  domain?: string;
  handle?: string;
  displayName: string;
  // Whether this source can be actively analyzed (fetched) right now.
  analyzable: boolean;
  note?: string;
}

const KNOWN_MARKETPLACES = [
  "amazon.",
  "ebay.",
  "etsy.",
  "aliexpress.",
  "flipkart.",
  "walmart.",
  "noon.",
  "daraz.",
  "mercadolibre.",
];

function stripWww(host: string): string {
  return host.replace(/^www\./, "");
}

export function parseSource(input: string): ParsedSource {
  const raw = input.trim();

  // WhatsApp (wa.me / api.whatsapp.com / phone number patterns)
  if (/wa\.me\//i.test(raw) || /api\.whatsapp\.com/i.test(raw) || /(?:whatsapp[:\s]+)?\+?\d[\d\s\-]{7,}$/i.test(raw)) {
    const phone = (raw.match(/\+?\d[\d\s\-]{7,}/) || [])[0]?.replace(/\s|-/g, "");
    return {
      type: "whatsapp",
      platform: "WhatsApp",
      raw,
      handle: phone,
      displayName: phone ? `WhatsApp seller ${phone.slice(0, 4)}•••` : "WhatsApp seller",
      analyzable: false,
      note: "WhatsApp sellers cannot be actively analyzed. TrustGraph relies on user-submitted evidence for messaging-based sellers.",
    };
  }

  // Bare @handle
  const bareHandle = raw.match(/^@([A-Za-z0-9._]+)$/);
  if (bareHandle) {
    return {
      type: "instagram",
      platform: "Instagram",
      raw,
      handle: bareHandle[1],
      displayName: `@${bareHandle[1]}`,
      analyzable: false,
      note: "Public social profiles are not scraped. Identity is resolved from user-submitted and permitted public links only.",
    };
  }

  // Try to interpret as URL (prepend https:// if missing a scheme)
  let url: URL | null = null;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    url = new URL(candidate);
  } catch {
    url = null;
  }

  if (!url) {
    return {
      type: "unknown",
      platform: "Unknown",
      raw,
      displayName: raw.slice(0, 60),
      analyzable: false,
      note: "The input could not be recognized as a URL, handle or contact.",
    };
  }

  const host = stripWww(url.hostname.toLowerCase());

  // Instagram
  if (host.includes("instagram.com")) {
    const handle = url.pathname.split("/").filter(Boolean)[0];
    return {
      type: "instagram",
      platform: "Instagram",
      raw,
      normalizedUrl: url.toString(),
      handle,
      displayName: handle ? `@${handle}` : "Instagram profile",
      analyzable: false,
      note: "Instagram content is not scraped in accordance with platform policy. Identity is resolved from permitted public links and user-submitted evidence.",
    };
  }

  // Facebook
  if (host.includes("facebook.com") || host.includes("fb.com")) {
    const handle = url.pathname.split("/").filter(Boolean)[0];
    return {
      type: "facebook",
      platform: "Facebook",
      raw,
      normalizedUrl: url.toString(),
      handle,
      displayName: handle ? `${handle} (Facebook)` : "Facebook page",
      analyzable: false,
      note: "Facebook content is not scraped. Identity relies on permitted public links and user-submitted evidence.",
    };
  }

  // TikTok
  if (host.includes("tiktok.com")) {
    const handle = url.pathname.split("/").filter(Boolean)[0]?.replace("@", "");
    return {
      type: "tiktok",
      platform: "TikTok",
      raw,
      normalizedUrl: url.toString(),
      handle,
      displayName: handle ? `@${handle} (TikTok)` : "TikTok profile",
      analyzable: false,
      note: "TikTok content is not scraped. Identity relies on permitted public links and user-submitted evidence.",
    };
  }

  // Marketplaces
  if (KNOWN_MARKETPLACES.some((m) => host.includes(m))) {
    return {
      type: "marketplace",
      platform: "Marketplace",
      raw,
      normalizedUrl: url.toString(),
      domain: host,
      displayName: `${host} seller/product`,
      analyzable: false,
      note: "Marketplace pages are governed by platform terms. TrustGraph resolves the seller shell and relies on user-submitted evidence rather than scraping.",
    };
  }

  // Product vs website heuristic: a deep path with product-ish segments.
  const path = url.pathname.toLowerCase();
  const looksLikeProduct = /\/(product|products|item|p|shop|store|dp|listing)\//.test(path) || /\/[a-z0-9-]{8,}$/.test(path);

  return {
    type: looksLikeProduct ? "product" : "website",
    platform: "Website",
    raw,
    normalizedUrl: url.toString(),
    domain: host,
    displayName: host,
    analyzable: true,
  };
}
