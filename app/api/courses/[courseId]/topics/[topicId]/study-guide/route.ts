import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { chat } from "@/lib/ai/provider";
import { SYSTEM_DIRECTIVE, studyGuidePrompt } from "@/lib/ai/prompts";
import { StudyGuideSchema, type StudyGuide } from "@/lib/ai/schemas";
import { searchChunks } from "@/lib/retrieval/search";
import { validateCitations } from "@/lib/validation/citations";

interface RouteParams {
  params: Promise<{ courseId: string; topicId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { courseId, topicId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch Topic
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select("id, course_id, title, description")
      .eq("id", topicId)
      .eq("course_id", courseId)
      .single();

    if (topicError || !topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // 2. Retrieve Grounded Source Chunks via Postgres FTS
    let chunks = await searchChunks(supabase, courseId, topic.title, 8);

    if (chunks.length === 0) {
      // Fallback: fetch any course chunks
      const { data: fallbackChunks } = await supabase
        .from("source_chunks")
        .select("id, source_id, course_id, page_number, chunk_index, text")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false })
        .limit(6);

      chunks = fallbackChunks ?? [];
    }

    if (chunks.length === 0) {
      return NextResponse.json(
        {
          error:
            "No course materials found. Please upload lecture slides or notes in the Materials tab first.",
        },
        { status: 400 }
      );
    }

    const chunkParams = chunks.map((c) => ({
      source_id: c.source_id,
      page: c.page_number,
      text: c.text.slice(0, 1000),
    }));

    // 3. Generate Masterclass & Study Guide
    const promptText = studyGuidePrompt({
      topicTitle: topic.title,
      topicDescription: topic.description,
      chunks: chunkParams,
    });

    const rawAiOutput = await chat({
      messages: [
        { role: "system", content: SYSTEM_DIRECTIVE },
        { role: "user", content: promptText },
      ],
      jsonHint: JSON.stringify({
        core_concept:
          "Limits describe the behavior of a function as the input approaches a target value, independent of whether the function is defined at that exact point.",
        key_rules: [
          "lim_{x->c} f(x) exists if and only if both left and right-hand limits exist and are equal.",
          "Indeterminate forms (0/0) require algebraic manipulation before evaluation.",
        ],
        pitfalls: [
          "Confusing f(c) with lim_{x->c} f(x).",
          "Assuming a limit does not exist just because there is a hole in the graph.",
        ],
        worked_example: {
          problem: "Find lim_{x->2} (x^2 - 4) / (x - 2).",
          solution_steps: [
            "Step 1: Direct substitution gives 0/0 (indeterminate).",
            "Step 2: Factor numerator as (x - 2)(x + 2).",
            "Step 3: Cancel (x - 2) for x != 2 to get (x + 2).",
            "Step 4: Evaluate as x -> 2 to obtain 4.",
          ],
          key_takeaway:
            "Removing the removable discontinuity reveals the true approaching value.",
        },
        diagnostic_check: {
          question:
            "If a function has f(3) undefined, does lim_{x->3} f(x) necessarily fail to exist?",
          options: [
            {
              key: "A",
              text: "Yes, a limit cannot exist if the function is not defined at that point.",
            },
            {
              key: "B",
              text: "No, the limit depends on behavior near 3, not the value at 3 itself.",
            },
            {
              key: "C",
              text: "Yes, undefined points always imply vertical asymptotes.",
            },
            {
              key: "D",
              text: "Only if the left-hand limit is also zero.",
            },
          ],
          correct_option: "B",
          distractor_misconceptions: {
            A: "Equates function value with limit behavior.",
            B: "Correct conceptual understanding.",
            C: "Assumes all undefined points are asymptotic rather than removable.",
            D: "Confusion regarding one-sided limits.",
          },
          rationale:
            "A limit evaluates neighborhood behavior as x approaches 3, so f(3) being undefined does not prevent the limit from existing.",
          belief_simulation: {
            implied_belief: "A function must exist at a point for its limit to exist.",
            consequence: "You would evaluate (x^2 - 9)/(x - 3) as having no limit at x = 3.",
            why_it_breaks: "Approaching from both sides gives 6, which is finite and well-defined.",
          },
          citations: [
            {
              source_id: chunkParams[0].source_id,
              page: chunkParams[0].page ?? 1,
              quote: chunkParams[0].text.slice(0, 70).trim(),
            },
          ],
        },
      }),
      temperature: 0.25,
    });

    const parsedJson = JSON.parse(rawAiOutput);

    // Normalize diagnostic_check fields if LLM varied keys
    if (parsedJson && parsedJson.diagnostic_check) {
      const dc = parsedJson.diagnostic_check;
      if (!dc.rationale) {
        dc.rationale =
          dc.explanation ||
          dc.reasoning ||
          dc.answer_explanation ||
          dc.solution_explanation ||
          (dc.distractor_misconceptions && typeof dc.distractor_misconceptions === "object"
            ? dc.distractor_misconceptions[dc.correct_option]
            : null) ||
          "Sound conceptual understanding grounded in course notes.";
      }
      if (!dc.distractor_misconceptions || typeof dc.distractor_misconceptions !== "object") {
        dc.distractor_misconceptions = {};
      }
      if (Array.isArray(dc.options)) {
        dc.options = dc.options.map((opt: Record<string, unknown>, i: number) => {
          if (typeof opt === "string") {
            const letter = String.fromCharCode(65 + i);
            return { key: letter, text: opt };
          }
          return {
            key: String(opt.key || String.fromCharCode(65 + i)).toUpperCase(),
            text: String(opt.text || opt.option || ""),
          };
        });
      }
    }

    const studyGuide: StudyGuide = StudyGuideSchema.parse(parsedJson);


    // 4. Validate citations against stored Postgres chunks (BUILD.md §2.4)
    const verifiedCitations = await validateCitations(
      supabase,
      courseId,
      studyGuide.diagnostic_check.citations
    );

    studyGuide.diagnostic_check.citations = verifiedCitations;

    // 5. Fetch user's current progress on this topic
    const { data: progress } = await supabase
      .from("topic_progress")
      .select("status, confident_error, status_reason")
      .eq("user_id", user.id)
      .eq("topic_id", topicId)
      .maybeSingle();

    return NextResponse.json({
      topic,
      studyGuide,
      progress: progress || {
        status: "not_assessed",
        confident_error: false,
        status_reason: "Not yet assessed",
      },
    });
  } catch (err: unknown) {
    console.error("[study-guide] Error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to generate study guide";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
