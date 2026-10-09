import { groq } from "./groq";
import { gemini } from "./gemini";
import { kilo } from "./kilo";
import type { ProviderAdapter, ChatRequest, ChatResponse } from "./types";
import { ProviderError } from "@/lib/errors";
import type { ProviderId } from "@/lib/types";

const REGISTRY: Record<ProviderId, ProviderAdapter> = { groq, gemini, kilo };

function order(): ProviderAdapter[] {
  const raw = (process.env.PROVIDER_PRIORITY || "groq,gemini,kilo")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as ProviderId[];
  const seen = new Set<ProviderId>();
  const out: ProviderAdapter[] = [];
  for (const id of raw) {
    if (REGISTRY[id] && !seen.has(id)) {
      out.push(REGISTRY[id]);
      seen.add(id);
    }
  }
  for (const id of ["groq", "gemini", "kilo"] as ProviderId[]) {
    if (!seen.has(id)) out.push(REGISTRY[id]);
  }
  return out;
}

export type FailoverResult = ChatResponse & {
  attempts: { provider: ProviderId; ok: boolean; error?: string; kind?: string }[];
};

const MAX_RETRIES_PER_PROVIDER = 1; // one retry on retryable errors
const TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 60000);

async function attempt(
  adapter: ProviderAdapter,
  req: ChatRequest,
  attempts: FailoverResult["attempts"],
): Promise<ChatResponse> {
  let lastErr: ProviderError | null = null;

  for (let i = 0; i <= MAX_RETRIES_PER_PROVIDER; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const out = await adapter.chat(req, controller.signal);
      clearTimeout(timer);
      attempts.push({ provider: adapter.id, ok: true });
      return out;
    } catch (e) {
      clearTimeout(timer);
      if (e instanceof ProviderError) {
        lastErr = e;
        attempts.push({ provider: adapter.id, ok: false, error: e.message, kind: e.kind });
        // Permanent errors: do not retry, do not failover on auth/bad_request
        // unless it is a model-availability problem (which we DO failover).
        if (!e.retryable) throw e;
      } else if ((e as any)?.name === "AbortError") {
        lastErr = new ProviderError(`Timeout after ${TIMEOUT_MS}ms`, adapter.id, "timeout", undefined, true);
        attempts.push({ provider: adapter.id, ok: false, error: lastErr.message, kind: "timeout" });
      } else {
        lastErr = new ProviderError(String((e as any)?.message || e), adapter.id, "network", undefined, true);
        attempts.push({ provider: adapter.id, ok: false, error: lastErr.message, kind: "network" });
      }
      // exponential backoff before retry
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastErr!;
}

/**
 * Real backend failover. Preserves the exact same request object
 * (messages, settings, research context) across every switch.
 */
export async function chatWithFailover(req: ChatRequest): Promise<FailoverResult> {
  const attempts: FailoverResult["attempts"] = [];
  const providers = order().filter((p) => p.configured());

  if (providers.length === 0) {
    throw new ProviderError(
      "No AI provider is configured. Set GROQ_API_KEY, GEMINI_API_KEY, or KILO_API_KEY.",
      "none",
      "auth",
      undefined,
      false,
    );
  }

  const permanentFailures: string[] = [];

  for (const adapter of providers) {
    try {
      const out = await attempt(adapter, req, attempts);
      return { ...out, attempts };
    } catch (e) {
      if (e instanceof ProviderError && !e.retryable) {
        // permanent error on this provider — do not move on unless it is
        // model_unavailable (handled as retryable above). Auth/bad_request
        // are permanent for the whole request.
        if (e.kind === "auth" || e.kind === "bad_request") {
          permanentFailures.push(`${adapter.id}: ${e.message}`);
          continue; // try next provider anyway — a different provider may still work
        }
      }
      permanentFailures.push(`${adapter.id}: ${(e as Error).message}`);
    }
  }

  throw new ProviderError(
    `All providers failed. Attempts:\n${permanentFailures.join("\n")}`,
    "all",
    "unknown",
    undefined,
    false,
  );
}

export function providerStatus() {
  return (["groq", "gemini", "kilo"] as ProviderId[]).map((id) => {
    const a = REGISTRY[id];
    return { id, configured: a.configured(), model: a.model() };
  });
  }
