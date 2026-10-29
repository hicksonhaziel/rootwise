import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/server";
import { chat } from "@/lib/ai/provider";
import { SYSTEM_DIRECTIVE } from "@/lib/ai/prompts";

interface RouteParams {
  params: Promise<{ code: string }>;
}

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
    const { sessionToken, answer, confidence, optedIn = true } = body;

    if (!sessionToken || !confidence) {
      return NextResponse.json(
        { error: "sessionToken and confidence are required" },
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

    // Quick misconception classification if an answer was typed
    let misconceptionCat = "conceptual_misconception";
    if (answer && answer.trim().length > 5) {
      try {
        const rawClass = await chat({
          messages: [
            { role: "system", content: SYSTEM_DIRECTIVE },
            {
              role: "user",
              content: `Classify the student's answer to this question into one category:
Question: ${room.question_text}
Student Answer: ${answer}

Return JSON with "category": one of [conceptual_misconception, missing_prerequisite, procedural_gap, calculation_or_execution_error, partially_correct, appears_correct]`,
            },
          ],
          jsonHint: '{"category": "conceptual_misconception"}',
          temperature: 0.1,
        });

        const parsed = JSON.parse(rawClass);
        if (parsed.category) {
          misconceptionCat = parsed.category;
        }
      } catch (classifyErr) {
        console.warn("[rooms/answer] Classification fallback:", classifyErr);
      }
    }

    // Upsert into room_answers to prevent double submission per sessionToken
    const { data: inserted, error: insertError } = await serviceClient
      .from("room_answers")
      .upsert(
        {
          room_id: room.id,
          session_token: sessionToken,
          opted_in: Boolean(optedIn),
          confidence,
          misconception_cat: misconceptionCat,
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
