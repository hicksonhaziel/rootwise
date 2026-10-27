#!/usr/bin/env tsx
/**
 * scripts/ai-ping.ts
 *
 * BUILD.md step 0.3 check — verifies the AI provider is reachable
 * and returns valid JSON.
 *
 * Usage:
 *   npm run ai:ping
 *   npm run ai:ping -- --model qwen3:4b  (override model)
 */

import { chat, AI_MODEL } from "../lib/ai/provider";

const modelArg = process.argv.find((a) => a.startsWith("--model="));
const model = modelArg?.split("=")[1] ?? AI_MODEL;

async function main() {
  console.log(`\n🔌 Pinging AI provider with model: ${model}\n`);

  const start = Date.now();

  const result = await chat({
    messages: [
      {
        role: "user",
        content:
          "Return a JSON object with two keys: 'status' (value: 'ok') and 'echo' (value: 'rootwise-ping'). Nothing else.",
      },
    ],
    jsonHint: '{ "status": "ok", "echo": "rootwise-ping" }',
    model,
  });

  const latency = Date.now() - start;
  const parsed = JSON.parse(result);

  console.log("✅ Response received");
  console.log("   Latency:", latency + "ms");
  console.log("   Parsed:", JSON.stringify(parsed, null, 2));

  if (parsed.status !== "ok") {
    throw new Error(`Unexpected status: ${parsed.status}`);
  }

  console.log("\n✅ AI provider check passed.\n");
}

main().catch((err) => {
  console.error("\n❌ AI provider check FAILED:", err.message);
  process.exit(1);
});
