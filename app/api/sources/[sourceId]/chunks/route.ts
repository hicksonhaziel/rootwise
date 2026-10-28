import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface RouteParams {
  params: Promise<{ sourceId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { sourceId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the source to verify access and info
  const { data: source, error: sourceError } = await supabase
    .from("sources")
    .select("id, course_id, filename, mime_type, processing_status, page_count")
    .eq("id", sourceId)
    .single();

  if (sourceError || !source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  // Fetch chunks ordered by chunk_index
  const { data: chunks, error: chunksError } = await supabase
    .from("source_chunks")
    .select("id, source_id, course_id, page_number, chunk_index, text, created_at")
    .eq("source_id", sourceId)
    .order("chunk_index", { ascending: true });

  if (chunksError) {
    return NextResponse.json({ error: chunksError.message }, { status: 500 });
  }

  return NextResponse.json({
    source,
    chunks: chunks ?? [],
    total_chunks: chunks?.length ?? 0,
  });
}
