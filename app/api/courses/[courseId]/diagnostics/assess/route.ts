import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { chat } from "@/lib/ai/provider";
import { SYSTEM_DIRECTIVE, diagnosisPrompt, DIAGNOSIS_JSON_HINT } from "@/lib/ai/prompts";
import { DiagnosisResponseSchema, type DiagnosisResponse } from "@/lib/ai/schemas";
import { searchChunks } from "@/lib/retrieval/search";
import { validateCitations } from "@/lib/validation/citations";
import { computeProgress, type Attempt } from "@/lib/progress/rules";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { courseId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      topicId,
      question,
      studentAnswer,
      confidence,
      attemptType = "initial",
      studyCheck,
    } = body;

    if (!topicId || !question || !studentAnswer || !confidence) {
      return NextResponse.json(
        { error: "topicId, question, studentAnswer, and confidence are required" },
        { status: 400 }
      );
    }

    if (!["sure", "think_so", "guessing"].includes(confidence)) {
      return NextResponse.json(
        { error: "confidence must be 'sure', 'think_so', or 'guessing'" },
        { status: 400 }
      );
    }

    // Fetch the current topic and all topics in course concurrently
    const [topicRes, allTopicsRes] = await Promise.all([
      supabase
        .from("topics")
        .select("id, title, description")
        .eq("id", topicId)
        .eq("course_id", courseId)
        .single(),
      supabase
        .from("topics")
        .select("id, title")
        .eq("course_id", courseId),
    ]);

    const topic = topicRes.data;
    if (topicRes.error || !topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    const allTopics = allTopicsRes.data ?? [];
    const otherTopicIds = allTopics
      .filter((t) => t.id !== topicId)
      .map((t) => t.id);

    let diagnosis: DiagnosisResponse;
    let verifiedCitations: { source_id: string; page?: number | null; quote: string; source_filename?: string }[] = [];

    if (studyCheck && studyCheck.selectedOption && studyCheck.correctOption) {
      const isCorrect = studyCheck.selectedOption === studyCheck.correctOption;
      diagnosis = {
        assessment: isCorrect ? "correct" : "incorrect",
        what_seems_correct: isCorrect
          ? ["Selected the correct principle and conclusion."]
          : [],
        possible_gap: {
          category: isCorrect ? "appears_correct" : "conceptual_misconception",
          description: isCorrect
            ? "Sound conceptual understanding demonstrated."
            : (studyCheck.distractorMisconceptions?.[studyCheck.selectedOption] || "Conceptual misconception identified."),
        },
        explanation: isCorrect
          ? studyCheck.rationale
          : `${studyCheck.distractorMisconceptions?.[studyCheck.selectedOption] || "Selected a common distractor."} ${studyCheck.rationale}`,
        next_step: {
          kind: isCorrect ? "explanation" : "hint",
          text: isCorrect
            ? "Concept demonstrated! Ready to advance to the next topic."
            : "Review the Key Rules and Worked Example in the study guide above.",
        },
        belief_simulation: !isCorrect && studyCheck.beliefSimulation ? studyCheck.beliefSimulation : null,
        prerequisite_topic_id: null,
        follow_up_question: "How would this conclusion change if boundary values were modified?",
        citations: Array.isArray(studyCheck.citations) ? studyCheck.citations : [],
      };

      verifiedCitations = await validateCitations(
        supabase,
        courseId,
        diagnosis.citations
      );
    } else {
      // Retrieve chunks relevant to the question and student answer
      const query = `${topic.title} ${question.slice(0, 100)} ${studentAnswer.slice(0, 100)}`;
      let chunks = await searchChunks(supabase, courseId, query, 4);

      if (chunks.length === 0) {
        const { data: fallbackChunks } = await supabase
          .from("source_chunks")
          .select("id, source_id, course_id, page_number, chunk_index, text")
          .eq("course_id", courseId)
          .order("created_at", { ascending: false })
          .limit(4);

        chunks = fallbackChunks ?? [];
      }

      const chunkParams = chunks.map((c) => ({
        source_id: c.source_id,
        page: c.page_number,
        text: c.text.slice(0, 800),
      }));

      const promptText = diagnosisPrompt({
        topicTitle: topic.title,
        question,
        studentAnswer,
        confidence,
        chunks: chunkParams,
        existingTopicIds: otherTopicIds,
      });

      const rawAiOutput = await chat({
        messages: [
          { role: "system", content: SYSTEM_DIRECTIVE },
          { role: "user", content: promptText },
        ],
        jsonHint: DIAGNOSIS_JSON_HINT,
        reasoningEffort: "low",
        maxTokens: 1200,
        temperature: 0.2,
      });

      const parsedJson = JSON.parse(rawAiOutput);
      diagnosis = DiagnosisResponseSchema.parse(parsedJson);

      // Validate citations against stored Postgres chunks (BUILD.md §2.4)
      verifiedCitations = await validateCitations(
        supabase,
        courseId,
        diagnosis.citations
      );
    }


    // Belief simulation rule (BUILD.md §2.5):
    // Only show implied_belief -> consequence -> why_it_breaks for conceptual_misconception
    // or partially_correct, AND only with verified citations. Otherwise omit it.
    const isEligibleCategory =
      diagnosis.possible_gap.category === "conceptual_misconception" ||
      diagnosis.possible_gap.category === "partially_correct";

    if (!isEligibleCategory || verifiedCitations.length === 0) {
      diagnosis.belief_simulation = null;
    }

    // Root Trace / Prerequisite check (BUILD.md §2.9):
    // Prerequisite topic ID must match an existing topic in this course
    let prerequisiteTopic = null;
    if (
      diagnosis.possible_gap.category === "missing_prerequisite" &&
      diagnosis.prerequisite_topic_id
    ) {
      const match = (allTopics ?? []).find(
        (t) => t.id === diagnosis.prerequisite_topic_id
      );
      if (match) {
        prerequisiteTopic = { id: match.id, title: match.title };
      } else {
        diagnosis.prerequisite_topic_id = null;
      }
    } else {
      diagnosis.prerequisite_topic_id = null;
    }

    // Confident error rule (BUILD.md §2.8): wrong + sure
    const isConfidentErr =
      diagnosis.assessment === "incorrect" && confidence === "sure";

    // Insert attempt record in diagnostic_attempts table
    const { data: attempt, error: attemptError } = await supabase
      .from("diagnostic_attempts")
      .insert({
        course_id: courseId,
        topic_id: topicId,
        user_id: user.id,
        question_text: question,
        student_answer: studentAnswer,
        assessment_json: diagnosis,
        citation_source_ids: verifiedCitations.map((c) => c.source_id),
        attempt_type: attemptType,
        confidence,
        diagnosis_category: diagnosis.possible_gap.category,
        assessment: diagnosis.assessment,
        diagnosis_rejected: false,
        confident_error: isConfidentErr,
      })
      .select()
      .single();

    if (attemptError || !attempt) {
      console.error("[diagnostics/assess] Attempt insert error:", attemptError);
      return NextResponse.json(
        { error: attemptError?.message || "Failed to record attempt" },
        { status: 500 }
      );
    }

    // Fetch all attempts for this user and topic (ordered chronologically)
    const { data: userAttempts } = await supabase
      .from("diagnostic_attempts")
      .select("id, attempt_type, assessment, confidence, diagnosis_category, created_at")
      .eq("user_id", user.id)
      .eq("topic_id", topicId)
      .order("created_at", { ascending: true });

    // Compute progress state machine (BUILD.md §2.8 & lib/progress/rules.ts)
    const formattedAttempts: Attempt[] = (userAttempts ?? []).map((a) => ({
      id: a.id,
      attempt_type: a.attempt_type as "initial" | "follow_up" | "exam_practice",
      assessment: a.assessment as "correct" | "partial" | "incorrect" | "insufficient",
      confidence: a.confidence as "sure" | "think_so" | "guessing",
      diagnosis_category: a.diagnosis_category,
      created_at: a.created_at,
    }));

    const progressUpdate = computeProgress(formattedAttempts);

    // Upsert into topic_progress table
    const { error: progressError } = await supabase
      .from("topic_progress")
      .upsert({
        user_id: user.id,
        course_id: courseId,
        topic_id: topicId,
        status: progressUpdate.status,
        status_reason: progressUpdate.status_reason,
        confident_error: progressUpdate.confident_error,
        recheck_due_at: progressUpdate.recheck_due_at,
        last_attempt_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (progressError) {
      console.error("[diagnostics/assess] Progress upsert error:", progressError);
    }

    return NextResponse.json({
      attempt,
      diagnosis,
      citations: verifiedCitations,
      progress: progressUpdate,
      prerequisiteTopic,
    });
  } catch (err: unknown) {
    console.error("[diagnostics/assess] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to assess answer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
