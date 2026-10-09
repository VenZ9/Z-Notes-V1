import type { ProviderId } from "@/lib/types";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ChatRequest = {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
};

export type ChatResponse = {
  text: string;
  provider: ProviderId;
  model: string;
  usage?: { prompt: number; completion: number };
};

export interface ProviderAdapter {
  id: ProviderId;
  configured(): boolean;
  model(): string;
  chat(req: ChatRequest, signal: AbortSignal): Promise<ChatResponse>;
}
