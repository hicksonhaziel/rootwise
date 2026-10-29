import fs from "fs";
import path from "path";
import { chat } from "../lib/ai/provider";
import { SYSTEM_DIRECTIVE, diagnosisPrompt } from "../lib/ai/prompts";
import { DiagnosisResponseSchema, type DiagnosisResponse } from "../lib/ai/schemas";

interface EvalCase {
  id: string;
  title: string;
  label: string;
  topic: string;
  question: string;
  student_answer: string;
  confidence: "sure" | "think_so" | "guessing";
  chunks: { source_id: string; page: number | null; text: string }[];
  expected: {
    assessment: string;
    category?: string;
    should_have_belief_simulation?: boolean;
    confident_error?: boolean;
  };
}

interface EvalResultItem {
  case_id: string;
  title: string;
  latency_ms: number;
  valid_json: boolean;
  valid_schema: boolean;
  assessment_match: boolean;
  category: string;
  expected_category?: string;
  citations_valid: boolean;
  citation_count: number;
  belief_simulation_present: boolean;
  error?: string;
}

async function runEval() {
  const args = process.argv.slice(2);
  let targetModel = process.env.AI_MODEL || "openai/gpt-oss-120b";
  const modelArgIdx = args.indexOf("--model");
  if (modelArgIdx !== -1 && args[modelArgIdx + 1]) {
    targetModel = args[modelArgIdx + 1];
  }

  console.log(`\n======================================================`);
  console.log(`  Rootwise Model Bake-Off & Evaluation Runner`);
  console.log(`  Target Model: ${targetModel}`);
  console.log(`  Timestamp:    ${new Date().toISOString()}`);
  console.log(`======================================================\n`);

  const fixturesDir = path.join(process.cwd(), "tests/fixtures/eval");
  if (!fs.existsSync(fixturesDir)) {
    console.error(`Fixtures directory not found: ${fixturesDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(fixturesDir).filter((f) => f.endsWith(".json")).sort();
  console.log(`Loaded ${files.length} evaluation test cases from ${fixturesDir}\n`);

  const results: EvalResultItem[] = [];
  let totalLatency = 0;
  let validJsonCount = 0;
  let validSchemaCount = 0;
  let validCitationsCount = 0;

  for (const file of files) {
    const rawCase = fs.readFileSync(path.join(fixturesDir, file), "utf8");
    const testCase: EvalCase = JSON.parse(rawCase);

    const startTime = Date.now();
    let validJson = false;
    let validSchema = false;
    let citationsValid = true;
    let parsedDiagnosis: DiagnosisResponse | null = null;
    let errorMsg: string | undefined;

    // Build diagnosis prompt
    const promptText = diagnosisPrompt({
      topicTitle: testCase.topic,
      question: testCase.question,
      studentAnswer: testCase.student_answer,
      confidence: testCase.confidence,
      chunks: testCase.chunks,
      existingTopicIds: ["00000000-0000-0000-0000-000000000001"],
    });

    try {
      const rawOutput = await chat({
        messages: [
          { role: "system", content: SYSTEM_DIRECTIVE },
          { role: "user", content: promptText },
        ],
        temperature: 0.2,
      });

      try {
        const json = JSON.parse(rawOutput);
        validJson = true;
        validJsonCount++;

        parsedDiagnosis = DiagnosisResponseSchema.parse(json);
        validSchema = true;
        validSchemaCount++;

        // Validate citations against case chunks
        const validSourceIds = new Set(testCase.chunks.map((c) => c.source_id));
        for (const cit of parsedDiagnosis.citations) {
          if (!validSourceIds.has(cit.source_id)) {
            citationsValid = false;
            break;
          }
        }
        if (citationsValid && parsedDiagnosis.citations.length > 0) {
          validCitationsCount++;
        }
      } catch (parseErr: unknown) {
        errorMsg = parseErr instanceof Error ? parseErr.message : "Schema parse error";
      }
    } catch (aiErr: unknown) {
      errorMsg = aiErr instanceof Error ? aiErr.message : "AI model request failed";
    }

    const latency = Date.now() - startTime;
    totalLatency += latency;

    const resultItem: EvalResultItem = {
      case_id: testCase.id,
      title: testCase.title,
      latency_ms: latency,
      valid_json: validJson,
      valid_schema: validSchema,
      assessment_match: parsedDiagnosis?.assessment === testCase.expected.assessment,
      category: parsedDiagnosis?.possible_gap?.category || "unknown",
      expected_category: testCase.expected.category,
      citations_valid: citationsValid,
      citation_count: parsedDiagnosis?.citations?.length || 0,
      belief_simulation_present: Boolean(parsedDiagnosis?.belief_simulation),
      error: errorMsg,
    };

    results.push(resultItem);

    const statusBadge = validSchema ? "✓ PASS" : "✗ FAIL";
    console.log(
      `[${testCase.id}] ${statusBadge} | ${latency}ms | Cat: ${resultItem.category} | ${testCase.title}`
    );

    // Brief inter-request delay to respect API rate limits
    await new Promise((r) => setTimeout(r, 1200));
  }


  // Summary Metrics
  const avgLatency = Math.round(totalLatency / files.length);
  const jsonRate = Math.round((validJsonCount / files.length) * 100);
  const schemaRate = Math.round((validSchemaCount / files.length) * 100);

  console.log(`\n------------------------------------------------------`);
  console.log(`EVALUATION SUMMARY (${targetModel})`);
  console.log(`------------------------------------------------------`);
  console.log(`Total Cases Evaluated:   ${files.length}`);
  console.log(`Valid JSON Rate:         ${validJsonCount}/${files.length} (${jsonRate}%)`);
  console.log(`Zod Schema Valid Rate:   ${validSchemaCount}/${files.length} (${schemaRate}%)`);
  console.log(`Average Latency:         ${avgLatency} ms`);
  console.log(`Grounded Citations Rate: ${validCitationsCount}/${files.length}`);
  console.log(`------------------------------------------------------\n`);

  // Write results to docs/eval-results/<sanitizedModel>.json
  const docsDir = path.join(process.cwd(), "docs/eval-results");
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  const sanitizedModel = targetModel.replace(/[^a-zA-Z0-9_-]/g, "_");
  const outputPath = path.join(docsDir, `${sanitizedModel}.json`);

  const report = {
    model: targetModel,
    evaluated_at: new Date().toISOString(),
    total_cases: files.length,
    metrics: {
      valid_json_rate_pct: jsonRate,
      schema_adherence_rate_pct: schemaRate,
      avg_latency_ms: avgLatency,
      grounded_citations_cases: validCitationsCount,
    },
    results,
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`Saved detailed report to: ${outputPath}\n`);
}

runEval().catch((err) => {
  console.error("Eval runner fatal error:", err);
  process.exit(1);
});
