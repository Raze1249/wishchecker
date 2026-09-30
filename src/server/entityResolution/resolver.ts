// Entity Resolution — determines whether different online identities likely
// belong to the same seller, ALWAYS with confidence + supporting evidence and
// never asserting a connection as fact without support.

export interface IdentityCandidate {
  type: string; // website | instagram | facebook | tiktok | marketplace | whatsapp
  label: string;
  businessName?: string;
  domain?: string;
  linkedDomain?: string; // e.g. website listed in a social bio
  contact?: string;
}

export type RelationshipState = "Verified" | "High confidence" | "Possible" | "Unknown" | "Disputed";

export interface IdentityMatch {
  a: string;
  b: string;
  confidence: number; // 0-100
  state: RelationshipState;
  evidence: string[];
  contradictions: string[];
}

function norm(s?: string): string {
  return (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function resolveIdentities(candidates: IdentityCandidate[]): IdentityMatch[] {
  const matches: IdentityMatch[] = [];

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i];
      const b = candidates[j];
      const evidence: string[] = [];
      const contradictions: string[] = [];
      let score = 0;

      // Same business name
      if (a.businessName && b.businessName) {
        if (norm(a.businessName) === norm(b.businessName)) {
          evidence.push("Same business name");
          score += 40;
        } else if (norm(a.businessName).includes(norm(b.businessName)) || norm(b.businessName).includes(norm(a.businessName))) {
          evidence.push("Similar business name");
          score += 20;
        }
      }

      // Website listed in profile / matching domain
      const aDomain = norm(a.domain);
      const bDomain = norm(b.domain);
      const aLinked = norm(a.linkedDomain);
      const bLinked = norm(b.linkedDomain);
      if (aDomain && (aDomain === bDomain || aDomain === bLinked)) {
        evidence.push("Same website / domain referenced");
        score += 35;
      } else if (bDomain && bDomain === aLinked) {
        evidence.push("Website listed in the other profile");
        score += 35;
      }

      // Matching public contact
      if (a.contact && b.contact && norm(a.contact) === norm(b.contact)) {
        evidence.push("Matching public contact information");
        score += 30;
      }

      if (evidence.length === 0) continue; // don't fabricate weak links

      score = Math.min(100, score);

      let state: RelationshipState;
      if (score >= 85) state = "High confidence";
      else if (score >= 50) state = "Possible";
      else state = "Unknown";

      matches.push({ a: a.label, b: b.label, confidence: score, state, evidence, contradictions });
    }
  }

  return matches;
}

export function overallIdentityConfidence(matches: IdentityMatch[], candidateCount: number): "High" | "Medium" | "Low" | "Insufficient Data" {
  if (candidateCount <= 1) return "Low";
  if (matches.length === 0) return "Insufficient Data";
  const best = Math.max(...matches.map((m) => m.confidence));
  if (best >= 85) return "High";
  if (best >= 50) return "Medium";
  return "Low";
}
