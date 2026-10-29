import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { chat } from "@/lib/ai/provider";
import { SYSTEM_DIRECTIVE, questionGenerationPrompt } from "@/lib/ai/prompts";
import { QuestionResponseSchema } from "@/lib/ai/schemas";
import { searchChunks } from "@/lib/retrieval/search";
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
    const body = await req.json();
    const topicId = body.topicId;

    if (!topicId) {
      return NextResponse.json({ error: "topicId is required" }, { status: 400 });
    }

    // Fetch the topic
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select("id, title, description, course_id")
      .eq("id", topicId)
      .eq("course_id", courseId)
      .single();

    if (topicError || !topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Retrieve chunks relevant to topic
    const searchQuery = `${topic.title} ${topic.description || ""}`.trim();
    let chunks = await searchChunks(supabase, courseId, searchQuery, 5);

    // If FTS returned 0 chunks, fetch recent chunks for the course
    if (chunks.length === 0) {
      const { data: recent } = await supabase
        .from("source_chunks")
        .select("id, source_id, course_id, page_number, chunk_index, text")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false })
        .limit(5);

      chunks = recent ?? [];
    }

    if (chunks.length === 0) {
      return NextResponse.json(
        {
          error:
            "No course materials found for this course. Please upload a PDF or paste notes first to ground your questions.",
        },
        { status: 400 }
      );
    }

    const chunkParams = chunks.map((c) => ({
      source_id: c.source_id,
      page: c.page_number,
      text: c.text.slice(0, 800),
    }));

    const promptText = questionGenerationPrompt({
      topicTitle: topic.title,
      chunks: chunkParams,
    });

    const rawAiOutput = await chat({
      messages: [
        { role: "system", content: SYSTEM_DIRECTIVE },
        { role: "user", content: promptText },
      ],
      jsonHint: JSON.stringify({
        question: "Diagnostic question asking the student to explain a core concept in their own words?",
        context_hint: "Focus on the relationship between...",
        citations: [
          {
            source_id: chunkParams[0].source_id,
            page: chunkParams[0].page ?? 1,
            quote: chunkParams[0].text.slice(0, 80).trim(),
          },
        ],
      }),
      temperature: 0.3,
    });

    const parsedJson = JSON.parse(rawAiOutput);
    const validated = QuestionResponseSchema.parse(parsedJson);

    // Validate citations against database chunks
    const verifiedCitations = await validateCitations(
      supabase,
      courseId,
      validated.citations
    );

    // If model didn't provide surviving citations, fallback to the top retrieved chunk
    let finalCitations = verifiedCitations;
    if (finalCitations.length === 0 && chunks.length > 0) {
      const topChunk = chunks[0];
      const { data: src } = await supabase
        .from("sources")
        .select("filename")
        .eq("id", topChunk.source_id)
        .single();

      finalCitations = [
        {
          source_id: topChunk.source_id,
          page: topChunk.page_number,
          quote: topChunk.text.slice(0, 120).trim(),
          source_filename: src?.filename || "Course notes",
        },
      ];
    }

    return NextResponse.json({
      question: validated.question,
      context_hint: validated.context_hint,
      citations: finalCitations,
      topic: {
        id: topic.id,
        title: topic.title,
        description: topic.description,
      },
    });
  } catch (err: unknown) {
    console.error("[diagnostics/question] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to generate question";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
