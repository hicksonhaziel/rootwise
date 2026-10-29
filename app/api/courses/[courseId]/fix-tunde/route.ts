import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { chat } from "@/lib/ai/provider";
import { SYSTEM_DIRECTIVE, fixTundePrompt } from "@/lib/ai/prompts";
import { searchChunks } from "@/lib/retrieval/search";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { courseId } = await params;
  const { searchParams } = new URL(req.url);
  const topicId = searchParams.get("topicId");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch a topic (either requested or first available)
    let topicQuery = supabase
      .from("topics")
      .select("id, title, description")
      .eq("course_id", courseId);

    if (topicId) {
      topicQuery = topicQuery.eq("id", topicId);
    }

    const { data: topics } = await topicQuery.limit(1);
    const topic = topics?.[0];

    if (!topic) {
      return NextResponse.json(
        { error: "No topics found. Please add a course topic first." },
        { status: 404 }
      );
    }

    // Retrieve chunks for topic
    let chunks = await searchChunks(supabase, courseId, topic.title, 4);
    if (chunks.length === 0) {
      const { data: recent } = await supabase
        .from("source_chunks")
        .select("id, source_id, course_id, page_number, chunk_index, text")
        .eq("course_id", courseId)
        .limit(4);
      chunks = recent ?? [];
    }

    const chunkParams = chunks.map((c) => ({
      source_id: c.source_id,
      page: c.page_number,
      text: c.text.slice(0, 800),
    }));

    const promptText = fixTundePrompt({
      topicTitle: topic.title,
      chunks: chunkParams,
    });

    const rawAi = await chat({
      messages: [
        { role: "system", content: SYSTEM_DIRECTIVE },
        { role: "user", content: promptText },
      ],
      jsonHint: JSON.stringify({
        explanation_with_misconception: "Tunde's explanation with one subtle planted error...",
        planted_misconception: {
          location_hint: "Second paragraph claims that...",
          correct_version: "The actual rule states that...",
        },
      }),
      temperature: 0.3,
    });

    const parsed = JSON.parse(rawAi);

    // Save session server-side (holding the planted misconception secure)
    const { data: session, error: sessionErr } = await supabase
      .from("fix_tunde_sessions")
      .insert({
        user_id: user.id,
        topic_id: topic.id,
        explanation_with_misconception: parsed.explanation_with_misconception,
        planted_misconception_hint: parsed.planted_misconception?.location_hint || "In the explanation",
        correct_version: parsed.planted_misconception?.correct_version || "Correct principle",
      })
      .select("id, topic_id, explanation_with_misconception, created_at")
      .single();

    if (sessionErr || !session) {
      return NextResponse.json(
        { error: sessionErr?.message || "Failed to create Fix Tunde session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      session,
      topic,
    });
  } catch (err: unknown) {
    console.error("[fix-tunde/generate] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to load Fix Tunde challenge";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { sessionId, studentFix } = body;

    if (!sessionId || !studentFix?.trim()) {
      return NextResponse.json(
        { error: "sessionId and studentFix are required" },
        { status: 400 }
      );
    }

    // Retrieve stored planted misconception
    const { data: session, error: sessionError } = await supabase
      .from("fix_tunde_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // AI grades the student's fix against the stored plant
    const gradingPrompt = `
You are grading whether a university student correctly identified and fixed a planted peer misconception.

Tunde's flawed explanation:
"${session.explanation_with_misconception}"

The hidden planted error that was in Tunde's text:
"${session.planted_misconception_hint}"

The correct principle that should replace it:
"${session.correct_version}"

The student's correction:
"${studentFix}"

Evaluate if the student caught the flaw and provided a sound correction.
Return JSON:
{
  "fix_result": "correct" | "partial" | "missed",
  "feedback": "2-3 supportive sentences explaining why the fix succeeded or what it missed."
}`;

    const rawGrade = await chat({
      messages: [
        { role: "system", content: SYSTEM_DIRECTIVE },
        { role: "user", content: gradingPrompt },
      ],
      jsonHint: '{"fix_result": "correct", "feedback": "Well done! You accurately spotted..."}',
      temperature: 0.1,
    });

    const parsedGrade = JSON.parse(rawGrade);
    const result = ["correct", "partial", "missed"].includes(parsedGrade.fix_result)
      ? parsedGrade.fix_result
      : "partial";

    // Update session with result
    await supabase
      .from("fix_tunde_sessions")
      .update({
        student_fix: studentFix,
        fix_result: result,
      })
      .eq("id", sessionId);

    return NextResponse.json({
      fixResult: result,
      feedback: parsedGrade.feedback,
      plantedMisconception: session.planted_misconception_hint,
      correctVersion: session.correct_version,
    });
  } catch (err: unknown) {
    console.error("[fix-tunde/grade] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to grade fix";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
