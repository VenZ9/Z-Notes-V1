export class ProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public kind: "rate_limit" | "timeout" | "server" | "model_unavailable" | "auth" | "bad_request" | "network" | "unknown",
    public status?: number,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export function classify(status: number, body: string, provider: string): ProviderError {
  const lower = body.toLowerCase();
  if (status === 401 || status === 403) {
    return new ProviderError(`Authentication failed for ${provider}. Check the API key.`, provider, "auth", status, false);
  }
  if (status === 404 || lower.includes("model") && lower.includes("not found")) {
    return new ProviderError(`Model unavailable on ${provider}: ${body.slice(0, 200)}`, provider, "model_unavailable", status, true);
  }
  if (status === 429) {
    return new ProviderError(`Rate limited by ${provider}.`, provider, "rate_limit", status, true);
  }
  if (status >= 500) {
    return new ProviderError(`${provider} server error (${status}).`, provider, "server", status, true);
  }
  if (status === 400) {
    return new ProviderError(`Bad request to ${provider}: ${body.slice(0, 200)}`, provider, "bad_request", status, false);
  }
  return new ProviderError(`${provider} error ${status}: ${body.slice(0, 200)}`, provider, "unknown", status, false);
}
