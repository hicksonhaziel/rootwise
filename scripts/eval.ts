import fs from "fs";
import path from "path";
import { chat } from "../lib/ai/provider";
import { SYSTEM_DIRECTIVE, DIAGNOSIS_JSON_HINT, diagnosisPrompt } from "../lib/ai/prompts";
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
  category_match: boolean;
  assessment_match: boolean;
  category: string;
  expected_category: string;
  assessment: string;
  expected_assessment: string;
  citations_total: number;
  citations_valid: number;
  belief_simulation_present: boolean;
  expected_belief_simulation: boolean;
  error?: string;
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[""'']/g, '"')
    .trim();
}

async function runEval() {
  const args = process.argv.slice(2);
  let targetModel = process.env.AI_MODEL || "openai/gpt-oss-120b";
  const modelArgIdx = args.indexOf("--model");
  if (modelArgIdx !== -1 && args[modelArgIdx + 1]) {
    targetModel = args[modelArgIdx + 1];
  }

  console.log(`\n======================================================`);
  console.log(`  Rootwise Production-Aligned Model Evaluation`);
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
  const latencies: number[] = [];
  let validJsonCount = 0;
  let validSchemaCount = 0;
  let categoryMatchCount = 0;
  let assessmentMatchCount = 0;
  let totalCitations = 0;
  let validCitations = 0;

  for (const file of files) {
    const rawCase = fs.readFileSync(path.join(fixturesDir, file), "utf8");
    const testCase: EvalCase = JSON.parse(rawCase);

    const startTime = Date.now();
    let validJson = false;
    let validSchema = false;
    let parsedDiagnosis: DiagnosisResponse | null = null;
    let errorMsg: string | undefined;

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
        jsonHint: DIAGNOSIS_JSON_HINT,
        model: targetModel,
        temperature: 0.2,
      });

      try {
        const json = JSON.parse(rawOutput);
        validJson = true;
        validJsonCount++;

        parsedDiagnosis = DiagnosisResponseSchema.parse(json);
        validSchema = true;
        validSchemaCount++;
      } catch (parseErr: unknown) {
        errorMsg = parseErr instanceof Error ? parseErr.message : "Schema parse error";
      }
    } catch (aiErr: unknown) {
      errorMsg = aiErr instanceof Error ? aiErr.message : "AI model request failed";
    }

    const latency = Date.now() - startTime;
    latencies.push(latency);

    // Citations validation against case chunks
    let caseCitationsTotal = 0;
    let caseCitationsValid = 0;

    if (parsedDiagnosis?.citations && parsedDiagnosis.citations.length > 0) {
      caseCitationsTotal = parsedDiagnosis.citations.length;
      totalCitations += caseCitationsTotal;

      for (const cit of parsedDiagnosis.citations) {
        const normQuote = normalise(cit.quote);
        const matchingChunks = testCase.chunks.filter((c) => c.source_id === cit.source_id);

        const isGrounded = matchingChunks.some((chunk) => {
          const normChunkText = normalise(chunk.text);
          const quoteMatches = normChunkText.includes(normQuote);
          const pageMatches =
            chunk.page === null ||
            cit.page === null ||
            cit.page === undefined ||
            chunk.page === cit.page;
          return quoteMatches && pageMatches;
        });

        if (isGrounded) {
          caseCitationsValid++;
          validCitations++;
        }
      }
    }

    const category = parsedDiagnosis?.possible_gap?.category || "unknown";
    const expectedCategory = testCase.expected.category || "unknown";
    const categoryMatch = category === expectedCategory;
    if (categoryMatch) categoryMatchCount++;

    const assessment = parsedDiagnosis?.assessment || "unknown";
    const expectedAssessment = testCase.expected.assessment;
    const assessmentMatch = assessment === expectedAssessment;
    if (assessmentMatch) assessmentMatchCount++;

    const beliefSimPresent = Boolean(parsedDiagnosis?.belief_simulation);
    const expectedBeliefSim = Boolean(testCase.expected.should_have_belief_simulation);

    const resultItem: EvalResultItem = {
      case_id: testCase.id,
      title: testCase.title,
      latency_ms: latency,
      valid_json: validJson,
      valid_schema: validSchema,
      category_match: categoryMatch,
      assessment_match: assessmentMatch,
      category,
      expected_category: expectedCategory,
      assessment,
      expected_assessment: expectedAssessment,
      citations_total: caseCitationsTotal,
      citations_valid: caseCitationsValid,
      belief_simulation_present: beliefSimPresent,
      expected_belief_simulation: expectedBeliefSim,
      error: errorMsg,
    };

    results.push(resultItem);

    const passBadge = categoryMatch && validSchema ? "✓ PASS" : "✗ FAIL";
    console.log(
      `[${testCase.id}] ${passBadge} | ${latency}ms | exp: ${expectedCategory} | got: ${category} | ${testCase.title}`
    );

    // Rate-limit delay between calls
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Summary Metrics
  const totalCases = files.length;
  const sortedLatencies = [...latencies].sort((a, b) => a - b);
  const meanLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / totalCases);
  const medianLatency =
    totalCases % 2 === 0
      ? Math.round((sortedLatencies[totalCases / 2 - 1] + sortedLatencies[totalCases / 2]) / 2)
      : sortedLatencies[Math.floor(totalCases / 2)];

  const validJsonRate = Math.round((validJsonCount / totalCases) * 100);
  const validSchemaRate = Math.round((validSchemaCount / totalCases) * 100);
  const categoryAccuracy = Math.round((categoryMatchCount / totalCases) * 100);
  const citationValidityRate =
    totalCitations > 0 ? Math.round((validCitations / totalCitations) * 100) : 100;

  console.log(`\n------------------------------------------------------`);
  console.log(`EVALUATION SUMMARY (${targetModel})`);
  console.log(`------------------------------------------------------`);
  console.log(`Total Cases:              ${totalCases}`);
  console.log(`Valid JSON Rate:          ${validJsonCount}/${totalCases} (${validJsonRate}%)`);
  console.log(`Zod Schema Rate:          ${validSchemaCount}/${totalCases} (${validSchemaRate}%)`);
  console.log(`Category Accuracy:        ${categoryMatchCount}/${totalCases} (${categoryAccuracy}%)`);
  console.log(`Assessment Match Rate:    ${assessmentMatchCount}/${totalCases} (${Math.round((assessmentMatchCount / totalCases) * 100)}%)`);
  console.log(`Citation Validity:        ${validCitations}/${totalCitations} (${citationValidityRate}%)`);
  console.log(`Mean Latency:             ${meanLatency} ms`);
  console.log(`Median Latency:           ${medianLatency} ms`);
  console.log(`------------------------------------------------------\n`);

  const docsDir = path.join(process.cwd(), "docs/eval-results");
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  const sanitizedModel = targetModel.replace(/[^a-zA-Z0-9_-]/g, "_");
  const outputPath = path.join(docsDir, `${sanitizedModel}.json`);

  const report = {
    model: targetModel,
    evaluated_at: new Date().toISOString(),
    total_cases: totalCases,
    metrics: {
      valid_json_rate_pct: validJsonRate,
      schema_adherence_rate_pct: validSchemaRate,
      category_accuracy_pct: categoryAccuracy,
      category_matches: categoryMatchCount,
      assessment_matches: assessmentMatchCount,
      citations_total: totalCitations,
      citations_valid: validCitations,
      citation_validity_pct: citationValidityRate,
      mean_latency_ms: meanLatency,
      median_latency_ms: medianLatency,
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
