// Domain Info Provider — pluggable interface for domain/WHOIS intelligence.
//
// Real WHOIS / domain-age data typically requires an authorized third-party
// provider (e.g. a WHOIS API). To keep the system useful without assuming
// access, we expose a provider interface with a clearly-labeled heuristic
// adapter. When a real provider is configured (DOMAIN_INTEL_API_KEY), this is
// where you would wire it in.

import dns from "node:dns/promises";

export interface DomainInfo {
  domain: string;
  resolvable: boolean;
  resolvedIp?: string;
  hasMx: boolean; // presence of mail records is a mild legitimacy signal
  // Domain age is *unknown* unless a real provider is connected.
  ageDays: number | null;
  ageSource: "provider" | "unavailable";
  note: string;
}

export interface DomainInfoProvider {
  lookup(domain: string): Promise<DomainInfo>;
}

// Heuristic adapter — uses only DNS (which we can legitimately query).
// It never fabricates a domain age; age is reported as null/unavailable.
class DnsHeuristicProvider implements DomainInfoProvider {
  async lookup(domain: string): Promise<DomainInfo> {
    let resolvable = false;
    let resolvedIp: string | undefined;
    let hasMx = false;

    try {
      const a = await dns.lookup(domain);
      resolvable = true;
      resolvedIp = a.address;
    } catch {
      resolvable = false;
    }

    try {
      const mx = await dns.resolveMx(domain);
      hasMx = Array.isArray(mx) && mx.length > 0;
    } catch {
      hasMx = false;
    }

    return {
      domain,
      resolvable,
      resolvedIp,
      hasMx,
      ageDays: null,
      ageSource: "unavailable",
      note: "Domain registration age requires an authorized WHOIS provider and is not available in this build. Configure DOMAIN_INTEL_API_KEY to enable it.",
    };
  }
}

export function getDomainInfoProvider(): DomainInfoProvider {
  // if (process.env.DOMAIN_INTEL_API_KEY) return new RealWhoisProvider();
  return new DnsHeuristicProvider();
}
