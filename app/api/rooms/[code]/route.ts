import { NextRequest, NextResponse, after } from "next/server";
import { createServiceClient } from "@/utils/supabase/server";
import { chat } from "@/lib/ai/provider";
import { SYSTEM_DIRECTIVE } from "@/lib/ai/prompts";

interface RouteParams {
  params: Promise<{ code: string }>;
}

const VALID_CONFIDENCE = new Set(["sure", "think_so", "guessing"]);

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { code } = await params;
  const serviceClient = await createServiceClient();

  const { data: room, error } = await serviceClient
    .from("room_sessions")
    .select("id, code, question_text, is_active, created_at, courses(title, course_code)")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (error || !room) {
    return NextResponse.json({ error: "Room not found or inactive" }, { status: 404 });
  }

  return NextResponse.json({ room });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { code } = await params;
  const serviceClient = await createServiceClient();

  try {
    const body = await req.json();
    const { sessionToken, answer = "", confidence, optedIn } = body;

    // Strict input validation
    if (typeof sessionToken !== "string" || sessionToken.length < 8 || sessionToken.length > 64) {
      return NextResponse.json(
        { error: "sessionToken must be a string between 8 and 64 characters." },
        { status: 400 }
      );
    }

    if (!confidence || !VALID_CONFIDENCE.has(confidence)) {
      return NextResponse.json(
        { error: "confidence must be one of: 'sure', 'think_so', 'guessing'." },
        { status: 400 }
      );
    }

    if (typeof optedIn !== "boolean") {
      return NextResponse.json(
        { error: "optedIn must be a boolean." },
        { status: 400 }
      );
    }

    if (typeof answer !== "string" || answer.length > 500) {
      return NextResponse.json(
        { error: "answer must be a string of at most 500 characters." },
        { status: 400 }
      );
    }

    const { data: room } = await serviceClient
      .from("room_sessions")
      .select("id, question_text, is_active")
      .eq("code", code.toUpperCase())
      .maybeSingle();

    if (!room || !room.is_active) {
      return NextResponse.json(
        { error: "This study room is no longer active." },
        { status: 400 }
      );
    }

    // Capacity check: maximum 200 answers per room
    const { count } = await serviceClient
      .from("room_answers")
      .select("*", { count: "exact", head: true })
      .eq("room_id", room.id);

    if (count !== null && count >= 200) {
      return NextResponse.json(
        { error: "This study room has reached its maximum limit of 200 answers." },
        { status: 400 }
      );
    }

    // Default misconception_cat is null (never default to conceptual_misconception)
    const { data: inserted, error: insertError } = await serviceClient
      .from("room_answers")
      .upsert(
        {
          room_id: room.id,
          session_token: sessionToken,
          opted_in: optedIn,
          confidence,
          misconception_cat: null,
        },
        { onConflict: "room_id, session_token" }
      )
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message || "Failed to submit answer" },
        { status: 500 }
      );
    }

    // Run AI classification asynchronously in the background so mobile response is instant
    const trimmedAnswer = answer.trim();
    if (trimmedAnswer.length > 5) {
      after(async () => {
        try {
          const rawClass = await chat({
            messages: [
              { role: "system", content: SYSTEM_DIRECTIVE },
              {
                role: "user",
                content: `Classify the student's answer to this question into one category:
Question: ${room.question_text}
Student Answer: ${trimmedAnswer}

Return JSON with "category": one of [conceptual_misconception, missing_prerequisite, procedural_gap, calculation_or_execution_error, partially_correct, appears_correct]`,
              },
            ],
            jsonHint: '{"category": "conceptual_misconception"}',
            temperature: 0.1,
          });

          const parsed = JSON.parse(rawClass);
          if (parsed.category) {
            const bgClient = await createServiceClient();
            await bgClient
              .from("room_answers")
              .update({ misconception_cat: parsed.category })
              .eq("id", inserted.id);
          }
        } catch (classifyErr) {
          console.warn("[rooms/answer] Async classification fallback:", classifyErr);
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Answer submitted to study room",
      answerId: inserted.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error submitting to room";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
