import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface RouteParams {
  params: Promise<{ courseId: string; topicId: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { courseId, topicId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updates: { title?: string; description?: string } = {};

    if (typeof body.title === "string" && body.title.trim()) {
      updates.title = body.title.trim();
    }
    if (typeof body.description === "string") {
      updates.description = body.description.trim() || undefined;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data: topic, error } = await supabase
      .from("topics")
      .update(updates)
      .eq("id", topicId)
      .eq("course_id", courseId)
      .select()
      .single();

    if (error || !topic) {
      return NextResponse.json(
        { error: error?.message || "Failed to update topic" },
        { status: 500 }
      );
    }

    return NextResponse.json({ topic });
  } catch (err) {
    console.error("[topics/patch] Error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { courseId, topicId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("topics")
    .delete()
    .eq("id", topicId)
    .eq("course_id", courseId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
