import type { Source } from "@/lib/types";

const ENDPOINT = "https://api.tavily.com/search";

export function researchConfigured() {
  return !!process.env.TAVILY_API_KEY;
}

/**
 * Real web search via Tavily. Never fabricates sources —
 * returns exactly what the API returns.
 */
export async function webSearch(query: string, maxResults = 6): Promise<Source[]> {
  if (!researchConfigured()) {
    throw new Error("TAVILY_API_KEY is not set — research unavailable.");
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      search_depth: "advanced",
      max_results: maxResults,
      include_answer: false,
      include_raw_content: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Tavily search failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const results: any[] = Array.isArray(data?.results) ? data.results : [];

  return results
    .filter((r) => typeof r?.url === "string" && typeof r?.title === "string")
    .map((r, i) => {
      let domain = "";
      try { domain = new URL(r.url).hostname.replace(/^www\./, ""); } catch {}
      return {
        id: `s${i + 1}`,
        title: String(r.title),
        url: String(r.url),
        domain,
        snippet: String(r.content || r.snippet || "").slice(0, 1200),
        score: typeof r.score === "number" ? r.score : 0,
        tier: "general" as const,
      };
    });
                        }
