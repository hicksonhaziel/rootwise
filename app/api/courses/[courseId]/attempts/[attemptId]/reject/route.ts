import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface RouteParams {
  params: Promise<{ courseId: string; attemptId: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { courseId, attemptId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: updated, error } = await supabase
      .from("diagnostic_attempts")
      .update({ diagnosis_rejected: true })
      .eq("id", attemptId)
      .eq("course_id", courseId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !updated) {
      return NextResponse.json(
        { error: error?.message || "Failed to update attempt" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Diagnosis marked as rejected by student",
      attempt: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
