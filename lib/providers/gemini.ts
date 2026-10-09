import { ProviderError, classify } from "@/lib/errors";
import type { ProviderAdapter, ChatRequest, ChatResponse } from "./types";

// Verified OpenAI-compatible endpoint for Gemini.
const BASE = "https://generativelanguage.googleapis.com/v1beta/openai";

export const gemini: ProviderAdapter = {
  id: "gemini",
  configured: () => !!process.env.GEMINI_API_KEY,
  // REQUIRED EXACT MODEL ID — do not substitute.
  model: () => process.env.GEMINI_MODEL || "gemini-3.8-flash",

  async chat(req: ChatRequest, signal: AbortSignal): Promise<ChatResponse> {
    const model = this.model();
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
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
      // Surface model-availability problems explicitly rather than
      // silently swapping to a different Gemini model.
      if (res.status === 404 || body.toLowerCase().includes("not found")) {
        throw new ProviderError(
          `Gemini model "${model}" is not available on the OpenAI-compatible endpoint. ` +
          `Verify GEMINI_MODEL and Google's current model list. Provider body: ${body.slice(0, 200)}`,
          "gemini",
          "model_unavailable",
          404,
          true,
        );
      }
      throw classify(res.status, body, "gemini");
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) {
      throw new ProviderError("Gemini returned an empty completion.", "gemini", "server", 200, true);
    }
    return {
      text,
      provider: "gemini",
      model,
      usage: {
        prompt: data?.usage?.prompt_tokens ?? 0,
        completion: data?.usage?.completion_tokens ?? 0,
      },
    };
  },
};
