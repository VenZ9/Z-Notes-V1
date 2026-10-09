import { ProviderError, classify } from "@/lib/errors";
import type { ProviderAdapter, ChatRequest, ChatResponse } from "./types";

// Verified from https://kilo.ai/docs/gateway/api-reference
const BASE = "https://api.kilo.ai/api/gateway";

export const kilo: ProviderAdapter = {
  id: "kilo",
  configured: () => !!process.env.KILO_API_KEY,
  model: () => process.env.KILO_MODEL || "anthropic/claude-sonnet-4.5",

  async chat(req: ChatRequest, signal: AbortSignal): Promise<ChatResponse> {
    const model = this.model();
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.KILO_API_KEY}`,
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
      throw classify(res.status, body, "kilo");
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) {
      throw new ProviderError("Kilo returned an empty completion.", "kilo", "server", 200, true);
    }
    return {
      text,
      provider: "kilo",
      model,
      usage: {
        prompt: data?.usage?.prompt_tokens ?? 0,
        completion: data?.usage?.completion_tokens ?? 0,
      },
    };
  },
};
