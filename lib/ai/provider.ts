/**
 * lib/ai/provider.ts
 *
 * Single OpenAI-compatible client for all model access.
 * Driven by env vars — swap Groq ↔ Ollama ↔ any provider without touching code.
 *
 * Rules (BUILD.md §0.3):
 *  - 30s timeout
 *  - One retry on invalid JSON
 *  - JSON / structured output mode
 *  - Never fake output — errors surface to the caller, not the UI
 */

import OpenAI from "openai";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const AI_BASE_URL = process.env.AI_BASE_URL ?? "https://api.groq.com/openai/v1";
const AI_API_KEY = process.env.AI_API_KEY ?? "";
const AI_MODEL = process.env.AI_MODEL ?? "openai/gpt-oss-120b";
const AI_TIMEOUT_MS = 30_000;
const AI_MAX_RETRIES = 1;

if (!AI_API_KEY && process.env.NODE_ENV !== "test") {
  console.warn("[ai/provider] AI_API_KEY is not set — model calls will fail.");
}

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

export const aiClient = new OpenAI({
  baseURL: AI_BASE_URL,
  apiKey: AI_API_KEY,
  timeout: AI_TIMEOUT_MS,
  maxRetries: AI_MAX_RETRIES,
  defaultHeaders: {
    "X-App-Name": "rootwise",
  },
});

export { AI_MODEL };

// ---------------------------------------------------------------------------
// Helper: chat completion with automatic JSON retry
// ---------------------------------------------------------------------------

interface ChatOptions {
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
  /** If provided, instructs the model to return JSON matching this schema hint */
  jsonHint?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function chat(options: ChatOptions): Promise<string> {
  const {
    messages,
    jsonHint,
    model = AI_MODEL,
    temperature = 0.3,
    maxTokens = 2048,
  } = options;

  // Inject JSON instruction when schema hint is provided
  const systemMessages: OpenAI.Chat.ChatCompletionMessageParam[] = jsonHint
    ? [
        {
          role: "system",
          content: `You must respond with valid JSON only. No markdown fences, no preamble, no explanation outside JSON.\n\nExpected schema:\n${jsonHint}`,
        },
      ]
    : [];

  const allMessages = [...systemMessages, ...messages];

  let attempt = 0;
  while (attempt <= AI_MAX_RETRIES) {
    try {
      const response = await aiClient.chat.completions.create({
        model,
        messages: allMessages,
        temperature,
        max_tokens: maxTokens,
        response_format: jsonHint ? { type: "json_object" } : undefined,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("Empty model response");

      // Verify JSON is parseable if we requested it
      if (jsonHint) {
        JSON.parse(content); // throws on invalid JSON — triggers retry
      }

      return content;
    } catch (err) {
      attempt++;
      if (attempt > AI_MAX_RETRIES) throw err;
      // Brief backoff before retry
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  throw new Error("AI provider: exhausted retries");
}
