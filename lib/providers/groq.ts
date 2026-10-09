import { ProviderError, classify } from "@/lib/errors";
import type { ProviderAdapter, ChatRequest, ChatResponse } from "./types";

const BASE = "https://api.groq.com/openai/v1";

export const groq: ProviderAdapter = {
  id: "groq",
  configured: () => !!process.env.GROQ_API_KEY,
  model: () => process.env.GROQ_MODEL || "llama-3.3-70b-versatile",

  async chat(req: ChatRequest, signal: AbortSignal): Promise<ChatResponse> {
    const model = this.model();
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: req.messages,
        temperature: req.temperature ?? 0.2,
        max_tokens: req.maxTokens ?? 4096,
        ...(req.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw classify(res.status, body, "groq");
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) {
      throw new ProviderError("Groq returned an empty completion.", "groq", "server", 200, true);
    }
    return {
      text,
      provider: "groq",
      model,
      usage: {
        prompt: data?.usage?.prompt_tokens ?? 0,
        completion: data?.usage?.completion_tokens ?? 0,
      },
    };
  },
};
