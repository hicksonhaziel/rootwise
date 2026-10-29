import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { chat } from "@/lib/ai/provider";
import { SYSTEM_DIRECTIVE } from "@/lib/ai/prompts";
import { validateCitations } from "@/lib/validation/citations";

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
    // Fetch course topics
    const { data: topics } = await supabase
      .from("topics")
      .select("id, title, description")
      .eq("course_id", courseId)
      .limit(10);

    if (!topics || topics.length === 0) {
      return NextResponse.json(
        { error: "Please add course topics or materials before generating exam practice." },
        { status: 400 }
      );
    }

    // Fetch sample chunks across the course
    const { data: chunks } = await supabase
      .from("source_chunks")
      .select("id, source_id, page_number, text")
      .eq("course_id", courseId)
      .limit(20);

    if (!chunks || chunks.length === 0) {
      return NextResponse.json(
        { error: "No course materials found. Please upload notes first." },
        { status: 400 }
      );
    }

    const chunkExcerpts = chunks.slice(0, 8).map((c) => ({
      source_id: c.source_id,
      page: c.page_number,
      text: c.text.slice(0, 600),
    }));

    const topicTitles = topics.map((t) => t.title).join(", ");
    const chunksText = chunkExcerpts
      .map((c) => `[source_id: ${c.source_id}, page: ${c.page ?? "unknown"}]\n${c.text}`)
      .join("\n\n---\n\n");

    const promptText = `
${SYSTEM_DIRECTIVE}

Generate a 5-question exam practice set for this university course based on the provided material.
Course topics: ${topicTitles}

Course material excerpts:
---
${chunksText}
---

Rules:
1. Generate EXACTLY 5 distinct questions covering core reasoning.
2. For each question, provide:
   - "id": number (1 to 5)
   - "topic_id": string (must match one of: ${topics.map((t) => t.id).join(", ")})
   - "topic_title": string
   - "question": string
   - "expected_answer_outline": string (scoring rubric or key reasoning)
   - "rationale": string (comprehensive explanation of correct reasoning)
   - "citations": array of { source_id, page, quote }

Return valid JSON with a "questions" array of 5 objects.`;

    const rawAiOutput = await chat({
      messages: [
        { role: "system", content: SYSTEM_DIRECTIVE },
        { role: "user", content: promptText },
      ],
      jsonHint: JSON.stringify({
        questions: [
          {
            id: 1,
            topic_id: topics[0].id,
            topic_title: topics[0].title,
            question: "Sample exam question...",
            expected_answer_outline: "Student should identify...",
            rationale: "The correct approach requires...",
            citations: [
              {
                source_id: chunkExcerpts[0]?.source_id || "",
                page: chunkExcerpts[0]?.page || 1,
                quote: chunkExcerpts[0]?.text.slice(0, 60) || "",
              },
            ],
          },
        ],
      }),
      temperature: 0.3,
    });

    const parsed = JSON.parse(rawAiOutput);
    const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];

    // Ensure citations in each question are validated
    const validatedQuestions = await Promise.all(
      rawQuestions.slice(0, 5).map(async (q: Record<string, unknown>, idx: number) => {
        const rawCits = Array.isArray(q.citations) ? (q.citations as { source_id: string; page?: number; quote: string }[]) : [];
        const verified = await validateCitations(supabase, courseId, rawCits);

        return {
          id: idx + 1,
          topic_id: q.topic_id || topics[idx % topics.length].id,
          topic_title: q.topic_title || topics[idx % topics.length].title,
          question: q.question,
          expected_answer_outline: q.expected_answer_outline,
          rationale: q.rationale,
          citations: verified.length > 0 ? verified : (chunkExcerpts.length > 0 ? [
            {
              source_id: chunkExcerpts[0].source_id,
              page: chunkExcerpts[0].page,
              quote: chunkExcerpts[0].text.slice(0, 100).trim(),
              source_filename: "Course Material",
            }
          ] : []),
        };
      })
    );

    return NextResponse.json({
      questions: validatedQuestions,
      course_id: courseId,
    });
  } catch (err: unknown) {
    console.error("[exam/generate] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to generate exam questions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
