import type { Source, GeneratedNote, ProviderId } from "@/lib/types";
import { chatWithFailover } from "@/lib/providers";
import { webSearch, researchConfigured } from "@/lib/research/tavily";
import { rankSources } from "@/lib/research/rank";

const SYSTEM = `You are Z-Notes, a meticulous research note generator.

STRICT RULES:
1. Only state facts that are supported by the supplied SOURCES. If a claim has
   no support, place it in the "unverified" array with a short reason.
2. Never invent a citation, URL, author, or publication. Cite only using the
   source ids provided (e.g. [s1], [s3]).
3. If SOURCES is empty or insufficient, say so explicitly in "unverified" and
   keep the note conservative.
4. Output valid JSON only, matching the schema exactly. No markdown fences.`;

const SCHEMA = `{
  "title": string,
  "summary": string,
  "sections": [{ "heading": string, "body": string }],
  "keyConcepts": [{ "term": string, "definition": string }],
  "revisionQuestions": string[],
  "citations": [{ "claim": string, "sourceIds": string[] }],
  "unverified": string[]
}`;

export type GenerateInput = {
  topic: string;
  extraContext?: string;      // from uploaded material
  useResearch: boolean;
  temperature?: number;
};

export type GenerateOutput = {
  note: GeneratedNote;
  sources: Source[];
  provider: ProviderId;
  model: string;
  researchUsed: boolean;
  researchError?: string;
  attempts: { provider: ProviderId; ok: boolean; error?: string }[];
};

export async function generateNote(input: GenerateInput): Promise<GenerateOutput> {
  let sources: Source[] = [];
  let researchError: string | undefined;
  let researchUsed = false;

  if (input.useResearch && researchConfigured()) {
    try {
      const raw = await webSearch(input.topic, 6);
      sources = rankSources(raw);
      researchUsed = sources.length > 0;
    } catch (e) {
      researchError = (e as Error).message;
    }
  } else if (input.useResearch && !researchConfigured()) {
    researchError = "Web research is unavailable — TAVILY_API_KEY is not configured. Facts could not be verified.";
  }

  const sourceBlock = sources.length
    ? sources.map((s) =>
        `[${s.id}] ${s.title}\nURL: ${s.url}\nSnippet: ${s.snippet}`,
      ).join("\n\n")
    : "(no sources available — mark unsupported claims as unverified)";

  const contextBlock = input.extraContext
    ? `\n\nUPLOADED MATERIAL (treat as user-provided context, cite as [upload]):\n${input.extraContext.slice(0, 12000)}`
    : "";

  const user = `TOPIC / QUESTION:
${input.topic}

SOURCES (real search results — cite only these ids):
${sourceBlock}${contextBlock}

Return a JSON object with exactly this shape:
${SCHEMA}`;

  const res = await chatWithFailover({
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ],
    temperature: input.temperature ?? 0.2,
    maxTokens: 4096,
    json: true,
  });

  const note = parseNote(res.text, sources);

  return {
    note,
    sources,
    provider: res.provider,
    model: res.model,
    researchUsed,
    researchError,
    attempts: res.attempts,
  };
}

function parseNote(raw: string, sources: Source[]): GeneratedNote {
  let text = raw.trim();
  // strip accidental code fences
  text = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  let obj: any;
  try {
    obj = JSON.parse(text);
  } catch {
    // fall back: wrap plain text so we never lose the user's generation
    return {
      title: "Untitled note",
      summary: text.slice(0, 400),
      sections: [{ heading: "Notes", body: text }],
      keyConcepts: [],
      revisionQuestions: [],
      citations: [],
      unverified: ["Model returned non-JSON output; shown verbatim."],
    };
  }

  const validIds = new Set(sources.map((s) => s.id));
  const citations = Array.isArray(obj.citations)
    ? obj.citations
        .map((c: any) => ({
          claim: String(c?.claim ?? ""),
          sourceIds: Array.isArray(c?.sourceIds)
            ? c.sourceIds.map(String).filter((id: string) => validIds.has(id))
            : [],
        }))
        .filter((c: any) => c.claim && c.sourceIds.length > 0)
    : [];

  return {
    title: String(obj.title ?? "Untitled note"),
    summary: String(obj.summary ?? ""),
    sections: Array.isArray(obj.sections)
      ? obj.sections.map((s: any) => ({ heading: String(s?.heading ?? ""), body: String(s?.body ?? "") }))
      : [],
    keyConcepts: Array.isArray(obj.keyConcepts)
      ? obj.keyConcepts.map((k: any) => ({ term: String(k?.term ?? ""), definition: String(k?.definition ?? "") }))
      : [],
    revisionQuestions: Array.isArray(obj.revisionQuestions)
      ? obj.revisionQuestions.map(String)
      : [],
    citations,
    unverified: Array.isArray(obj.unverified) ? obj.unverified.map(String) : [],
  };
                            }
