import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface RouteParams {
  params: Promise<{ courseId: string; topicId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { courseId, topicId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [{ data: topic }, { data: progress }, { data: attempts }] =
      await Promise.all([
        supabase
          .from("topics")
          .select("id, title, description, course_id")
          .eq("id", topicId)
          .eq("course_id", courseId)
          .single(),
        supabase
          .from("topic_progress")
          .select("status, status_reason, confident_error, recheck_due_at, last_attempt_at")
          .eq("user_id", user.id)
          .eq("topic_id", topicId)
          .maybeSingle(),
        supabase
          .from("diagnostic_attempts")
          .select(
            "id, attempt_type, question_text, student_answer, confidence, diagnosis_category, assessment, assessment_json, diagnosis_rejected, confident_error, created_at"
          )
          .eq("user_id", user.id)
          .eq("topic_id", topicId)
          .order("created_at", { ascending: false }),
      ]);

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    return NextResponse.json({
      topic,
      progress: progress ?? {
        status: "not_assessed",
        status_reason: "No attempts recorded yet.",
        confident_error: false,
        recheck_due_at: null,
      },
      attempts: attempts ?? [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load attempts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
