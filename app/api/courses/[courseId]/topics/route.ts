import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface RouteParams {
  params: Promise<{ courseId: string }>;
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

  const { data: topics, error } = await supabase
    .from("topics")
    .select("id, course_id, title, description, created_by, created_at")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get progress status for each topic for this user
  const topicIds = (topics ?? []).map((t) => t.id);
  const progressMap: Record<string, { status: string; confident_error: boolean }> = {};

  if (topicIds.length > 0) {
    const { data: progress } = await supabase
      .from("topic_progress")
      .select("topic_id, status, confident_error")
      .eq("user_id", user.id)
      .in("topic_id", topicIds);

    if (progress) {
      for (const p of progress) {
        progressMap[p.topic_id] = {
          status: p.status,
          confident_error: p.confident_error,
        };
      }
    }
  }

  const topicsWithProgress = (topics ?? []).map((t) => ({
    ...t,
    status: progressMap[t.id]?.status ?? "not_assessed",
    confident_error: progressMap[t.id]?.confident_error ?? false,
  }));

  return NextResponse.json({ topics: topicsWithProgress });
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
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const { data: topic, error } = await supabase
      .from("topics")
      .insert({
        course_id: courseId,
        title,
        description: description || null,
        created_by: "user",
      })
      .select()
      .single();

    if (error || !topic) {
      return NextResponse.json(
        { error: error?.message || "Failed to create topic" },
        { status: 500 }
      );
    }

    return NextResponse.json({ topic }, { status: 201 });
  } catch (err) {
    console.error("[topics/create] Error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
