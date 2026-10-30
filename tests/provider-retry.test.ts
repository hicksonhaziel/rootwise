import { describe, it, expect, vi, beforeEach } from "vitest";
import { chat, aiClient } from "../lib/ai/provider";

describe("lib/ai/provider — chat retry behavior", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("retries when the first response contains invalid JSON and succeeds on the second attempt", async () => {
    const createSpy = vi.spyOn(aiClient.chat.completions, "create")
      // First attempt returns malformed JSON
      .mockResolvedValueOnce({
        choices: [
          {
            message: { content: "This is { not valid json: 123" },
          },
        ],
      } as any)
      // Second attempt returns valid JSON
      .mockResolvedValueOnce({
        choices: [
          {
            message: { content: '{"status": "recovered", "category": "appears_correct"}' },
          },
        ],
      } as any);

    const result = await chat({
      messages: [{ role: "user", content: "Test prompt" }],
      jsonHint: '{"status": "string", "category": "string"}',
    });

    expect(createSpy).toHaveBeenCalledTimes(2);
    expect(JSON.parse(result)).toEqual({
      status: "recovered",
      category: "appears_correct",
    });
  });

  it("throws after exhausting max retries if invalid JSON persists", async () => {
    vi.spyOn(aiClient.chat.completions, "create")
      .mockResolvedValue({
        choices: [
          {
            message: { content: "permanently broken { json" },
          },
        ],
      } as any);

    await expect(
      chat({
        messages: [{ role: "user", content: "Test prompt" }],
        jsonHint: '{"status": "string"}',
      })
    ).rejects.toThrow();
  });
});
