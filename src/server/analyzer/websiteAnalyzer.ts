// Website Analyzer — safely fetches a public website's homepage and extracts
// factual, observable signals. It performs NO accusations; it only reports what
// is present / absent. All fetching goes through the SSRF guard.

import { safeFetch } from "@/server/security/ssrfGuard";
import { getDomainInfoProvider, type DomainInfo } from "./domainInfoProvider";

export interface WebsiteFinding {
  key: string;
  label: string;
  present: boolean | null; // true present, false absent, null unknown
  detail?: string;
}

export interface WebsiteAnalysis {
  reachable: boolean;
  finalUrl?: string;
  httpsEnabled: boolean;
  statusCode?: number;
  websiteTitle?: string;
  findings: WebsiteFinding[];
  domainInfo: DomainInfo;
  error?: string;
}

const POLICY_PATTERNS: Array<{ key: string; label: string; patterns: RegExp[] }> = [
  { key: "refund_policy", label: "Refund policy", patterns: [/refund\s*polic/i, /money[-\s]?back/i] },
  { key: "return_policy", label: "Return policy", patterns: [/return\s*polic/i, /returns?\b/i] },
  { key: "privacy_policy", label: "Privacy policy", patterns: [/privacy\s*polic/i] },
  { key: "terms", label: "Terms & conditions", patterns: [/terms\s*(of|&|and)/i, /terms\s*&?\s*conditions/i] },
  { key: "shipping_policy", label: "Shipping policy", patterns: [/shipping\s*polic/i, /delivery\s*polic/i] },
];

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1].trim().slice(0, 160) : undefined;
}

function hasContactInfo(html: string): { present: boolean; detail: string } {
  const email = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(html);
  const phone = /(\+?\d[\d\s().-]{7,}\d)/.test(html);
  const contactLink = /contact\s*(us)?/i.test(html);
  const found: string[] = [];
  if (email) found.push("email");
  if (phone) found.push("phone");
  if (contactLink) found.push("contact page");
  return { present: found.length > 0, detail: found.length ? `Found: ${found.join(", ")}` : "No email, phone or contact page detected on the homepage." };
}

export async function analyzeWebsite(urlOrDomain: string): Promise<WebsiteAnalysis> {
  const domainInfoProvider = getDomainInfoProvider();

  const url = /^https?:\/\//i.test(urlOrDomain) ? urlOrDomain : `https://${urlOrDomain}`;
  let domain = "";
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    domain = urlOrDomain;
  }

  const domainInfo = await domainInfoProvider.lookup(domain);
  const result = await safeFetch(url, { timeoutMs: 9000 });

  if (!result.ok || !result.body) {
    return {
      reachable: false,
      httpsEnabled: url.startsWith("https://"),
      findings: [],
      domainInfo,
      error: result.error ?? "The website could not be reached.",
    };
  }

  const html = result.body;
  const finalUrl = result.finalUrl ?? url;
  const httpsEnabled = finalUrl.startsWith("https://");
  const title = extractTitle(html);

  const findings: WebsiteFinding[] = [];

  findings.push({
    key: "https",
    label: "HTTPS / secure connection",
    present: httpsEnabled,
    detail: httpsEnabled ? "The site is served over HTTPS." : "The site is not served over HTTPS.",
  });

  const contact = hasContactInfo(html);
  findings.push({ key: "contact_info", label: "Contact information", present: contact.present, detail: contact.detail });

  for (const policy of POLICY_PATTERNS) {
    const present = policy.patterns.some((p) => p.test(html));
    findings.push({
      key: policy.key,
      label: policy.label,
      present,
      detail: present ? `Reference to a ${policy.label.toLowerCase()} was detected on the homepage.` : `No reference to a ${policy.label.toLowerCase()} was found on the homepage.`,
    });
  }

  // Mail records (mild legitimacy signal)
  findings.push({
    key: "mx_records",
    label: "Domain email (MX) records",
    present: domainInfo.hasMx,
    detail: domainInfo.hasMx ? "The domain has mail (MX) records configured." : "No mail (MX) records were found for the domain.",
  });

  // Domain age (honest unknown)
  findings.push({
    key: "domain_age",
    label: "Domain registration age",
    present: null,
    detail: domainInfo.note,
  });

  return {
    reachable: true,
    finalUrl,
    httpsEnabled,
    statusCode: result.status,
    websiteTitle: title,
    findings,
    domainInfo,
  };
}
