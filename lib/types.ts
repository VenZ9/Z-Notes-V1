export type Source = {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  score: number;
  tier: "primary" | "institutional" | "reference" | "general";
};

export type NoteSection = {
  heading: string;
  body: string;
};

export type GeneratedNote = {
  title: string;
  summary: string;
  sections: NoteSection[];
  keyConcepts: { term: string; definition: string }[];
  revisionQuestions: string[];
  citations: { claim: string; sourceIds: string[] }[];
  unverified: string[];
};

export type NoteRecord = {
  id: string;
  title: string;
  topic: string;
  content: string;           // markdown
  sources: Source[];
  provider: string | null;
  model: string | null;
  status: "draft" | "generating" | "ready" | "error";
  createdAt: string;
  updatedAt: string;
};

export type ProviderId = "groq" | "gemini" | "kilo";
