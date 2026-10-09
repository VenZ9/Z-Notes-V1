import type { Source } from "@/lib/types";

const PRIMARY = [
  ".gov", ".edu", ".ac.uk", ".gov.uk",
  "arxiv.org", "doi.org", "nature.com", "science.org", "pubmed.ncbi.nlm.nih.gov",
  "who.int", "nasa.gov", "nih.gov", "ieee.org", "acm.org",
];
const INSTITUTIONAL = [
  "mit.edu", "stanford.edu", "harvard.edu", "ox.ac.uk", "cam.ac.uk",
  "openai.com", "ai.google.dev", "deepmind.google", "anthropic.com",
  "docs.python.org", "developer.mozilla.org", "react.dev", "nextjs.org",
  "vercel.com", "nodejs.org", "typescriptlang.org",
];
const REFERENCE = ["wikipedia.org", "britannica.com", "github.com", "stackoverflow.com"];

function tierFor(domain: string, url: string): Source["tier"] {
  const hay = `${domain}${url}`.toLowerCase();
  if (PRIMARY.some((d) => hay.includes(d))) return "primary";
  if (INSTITUTIONAL.some((d) => hay.includes(d))) return "institutional";
  if (REFERENCE.some((d) => hay.includes(d))) return "reference";
  return "general";
}

const TIER_WEIGHT: Record<Source["tier"], number> = {
  primary: 1.0, institutional: 0.8, reference: 0.6, general: 0.3,
};

/**
 * Rank real search results. No source is ever invented;
 * this only reorders what Tavily returned.
 */
export function rankSources(sources: Source[]): Source[] {
  return [...sources]
    .map((s) => {
      const tier = tierFor(s.domain, s.url);
      return { ...s, tier, score: (s.score || 0) + TIER_WEIGHT[tier] };
    })
    .sort((a, b) => b.score - a.score);
}
