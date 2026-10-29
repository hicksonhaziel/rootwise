import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/utils/supabase/server";
import { computeCohortSummary, PRIVACY_THRESHOLD_DEMO } from "@/lib/privacy/cohort";

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { code } = await params;
  const supabase = await createClient();
  const serviceClient = await createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the requester is the host of this room
  const { data: room, error: roomError } = await serviceClient
    .from("room_sessions")
    .select("id, code, host_user_id, question_text, is_active, created_at")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (roomError || !room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.host_user_id !== user.id) {
    return NextResponse.json(
      { error: "Only the room host can view live cohort analytics." },
      { status: 403 }
    );
  }

  // Fetch all room answers (anonymous - no student names or emails)
  const { data: answers, error: answersError } = await serviceClient
    .from("room_answers")
    .select("opted_in, confidence, misconception_cat, created_at")
    .eq("room_id", room.id);

  if (answersError) {
    return NextResponse.json({ error: answersError.message }, { status: 500 });
  }

  const rawAnswers = (answers ?? []).map((a) => ({
    opted_in: a.opted_in,
    confidence: a.confidence,
    misconception_cat: a.misconception_cat,
  }));

  // Compute privacy-safe aggregate (threshold of 3 for demo)
  const cohort = computeCohortSummary(rawAnswers, PRIVACY_THRESHOLD_DEMO);

  return NextResponse.json({
    room,
    cohort,
    totalAnswersCount: rawAnswers.length,
  });
}
