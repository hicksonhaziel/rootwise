import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { chat } from "@/lib/ai/provider";
import { SYSTEM_DIRECTIVE, topicOutlinePrompt } from "@/lib/ai/prompts";
import { TopicOutlineSchema } from "@/lib/ai/schemas";

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

  // Fetch chunks for this course to feed to the model
  const { data: chunks, error: chunksError } = await supabase
    .from("source_chunks")
    .select("text, page_number")
    .eq("course_id", courseId)
    .order("chunk_index", { ascending: true })
    .limit(30);

  if (chunksError) {
    return NextResponse.json({ error: chunksError.message }, { status: 500 });
  }

  if (!chunks || chunks.length === 0) {
    return NextResponse.json(
      { error: "No course materials found. Please upload a PDF or paste notes first." },
      { status: 400 }
    );
  }

  const chunksText = chunks
    .map(
      (c) =>
        `[Page ${c.page_number ?? "unspecified"}]\n${c.text.slice(0, 800)}`
    )
    .join("\n\n---\n\n");

  try {
    const rawAiOutput = await chat({
      messages: [
        { role: "system", content: SYSTEM_DIRECTIVE },
        { role: "user", content: topicOutlinePrompt(chunksText) },
      ],
      jsonHint: JSON.stringify({
        topics: [
          {
            title: "Topic Title",
            description: "Concise summary of what this topic covers (max 100 words).",
          },
        ],
      }),
      temperature: 0.2,
    });

    const parsedJson = JSON.parse(rawAiOutput);
    const validated = TopicOutlineSchema.parse(parsedJson);

    // Save proposed topics to DB
    const rowsToInsert = validated.topics.map((t) => ({
      course_id: courseId,
      title: t.title,
      description: t.description,
      created_by: "system" as const,
    }));

    const { data: insertedTopics, error: insertError } = await supabase
      .from("topics")
      .insert(rowsToInsert)
      .select();

    if (insertError) {
      console.error("[topics/generate] DB insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      topics: insertedTopics ?? [],
      disclaimer: "Suggested topics, not your official syllabus",
    });
  } catch (err: unknown) {
    console.error("[topics/generate] AI generation error:", err);
    const message = err instanceof Error ? err.message : "Failed to generate topics";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
