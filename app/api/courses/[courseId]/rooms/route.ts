import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "RW-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { courseId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: rooms, error } = await supabase
    .from("room_sessions")
    .select("id, code, question_text, is_active, created_at")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rooms: rooms ?? [] });
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
    const questionText =
      typeof body.questionText === "string" ? body.questionText.trim() : "";

    if (!questionText || questionText.length < 10) {
      return NextResponse.json(
        { error: "A valid question of at least 10 characters is required to launch a room." },
        { status: 400 }
      );
    }

    // Generate unique room code
    let code = generateRoomCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      attempts++;
      const { data: existing } = await supabase
        .from("room_sessions")
        .select("id")
        .eq("code", code)
        .maybeSingle();

      if (!existing) {
        isUnique = true;
      } else {
        code = generateRoomCode();
      }
    }

    const { data: room, error } = await supabase
      .from("room_sessions")
      .insert({
        host_user_id: user.id,
        course_id: courseId,
        code,
        question_text: questionText,
        is_active: true,
      })
      .select()
      .single();

    if (error || !room) {
      return NextResponse.json(
        { error: error?.message || "Failed to create room" },
        { status: 500 }
      );
    }

    return NextResponse.json({ room }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create room";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
