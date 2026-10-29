import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/utils/supabase/server";
import { extractPdfText, chunkPages } from "@/lib/pdf/extract";

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

  // Verify membership or ownership
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .single();

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const { data: sources, error } = await supabase
    .from("sources")
    .select("id, filename, mime_type, storage_path, processing_status, processing_error, page_count, created_at")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get chunk counts for each source
  const sourceIds = (sources ?? []).map((s) => s.id);
  const chunkCountMap: Record<string, number> = {};

  if (sourceIds.length > 0) {
    const { data: chunks } = await supabase
      .from("source_chunks")
      .select("source_id")
      .in("source_id", sourceIds);

    if (chunks) {
      for (const c of chunks) {
        chunkCountMap[c.source_id] = (chunkCountMap[c.source_id] || 0) + 1;
      }
    }
  }

  const sourcesWithCount = (sources ?? []).map((s) => ({
    ...s,
    chunk_count: chunkCountMap[s.id] || 0,
  }));

  return NextResponse.json({ sources: sourcesWithCount });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { courseId } = await params;
  const supabase = await createClient();
  const serviceClient = await createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  // ---------------------------------------------------------------------------
  // 1. PDF File Upload
  // ---------------------------------------------------------------------------
  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
        return NextResponse.json(
          { error: "Only PDF documents are supported for upload." },
          { status: 400 }
        );
      }

      const rawArrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(rawArrayBuffer);
      const { pages, totalPages, isScanned } = await extractPdfText(rawArrayBuffer.slice(0));

      // Scanned PDF detection (BUILD.md §1.2 check)
      if (isScanned) {
        // Record scanned document in DB with error message
        const { data: scannedSource } = await serviceClient
          .from("sources")
          .insert({
            course_id: courseId,
            uploaded_by: user.id,
            filename: file.name,
            mime_type: "application/pdf",
            storage_path: "unindexed/scanned",
            processing_status: "scanned",
            processing_error: "This looks scanned. Rootwise needs a text PDF",
            page_count: totalPages,
          })
          .select()
          .single();

        return NextResponse.json(
          {
            error: "This looks scanned. Rootwise needs a text PDF",
            isScanned: true,
            source: scannedSource,
          },
          { status: 422 }
        );
      }

      // Safe storage path
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${courseId}/${Date.now()}-${sanitizedName}`;

      // Upload file to Supabase storage bucket
      const { error: uploadError } = await serviceClient.storage
        .from("sources")
        .upload(storagePath, fileBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        console.warn("[sources/upload] Storage error, attempting bucket setup/recovery:", uploadError.message);
        if (
          uploadError.message?.toLowerCase().includes("not found") ||
          (uploadError as unknown as { error?: string })?.error?.toLowerCase().includes("not found")
        ) {
          try {
            await serviceClient.storage.createBucket("sources", { public: false });
            await serviceClient.storage
              .from("sources")
              .upload(storagePath, fileBuffer, {
                contentType: "application/pdf",
                upsert: true,
              });
          } catch (createErr) {
            console.warn("[sources/upload] Could not auto-create sources bucket:", createErr);
          }
        }
      }

      // Insert source metadata record
      const { data: source, error: sourceError } = await serviceClient
        .from("sources")
        .insert({
          course_id: courseId,
          uploaded_by: user.id,
          filename: file.name,
          mime_type: "application/pdf",
          storage_path: storagePath,
          processing_status: "ready",
          page_count: totalPages,
        })
        .select()
        .single();

      if (sourceError || !source) {
        return NextResponse.json(
          { error: sourceError?.message || "Failed to save source" },
          { status: 500 }
        );
      }

      // Chunk pages (~500 tokens with overlap)
      const chunks = chunkPages(pages);

      if (chunks.length > 0) {
        const chunkRows = chunks.map((c) => ({
          source_id: source.id,
          course_id: courseId,
          page_number: c.pageNumber,
          chunk_index: c.chunkIndex,
          text: c.text,
        }));

        const { error: chunkError } = await serviceClient
          .from("source_chunks")
          .insert(chunkRows);

        if (chunkError) {
          console.error("[sources/chunk] Chunk insert error:", chunkError);
        }
      }

      return NextResponse.json(
        {
          source: {
            ...source,
            chunk_count: chunks.length,
          },
        },
        { status: 201 }
      );
    } catch (err) {
      console.error("[sources/upload] Unexpected error:", err);
      return NextResponse.json(
        { error: "Failed to process PDF document" },
        { status: 500 }
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Paste Notes / Plain text
  // ---------------------------------------------------------------------------
  try {
    const body = await req.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Pasted Notes";

    if (!text || text.length < 30) {
      return NextResponse.json(
        { error: "Pasted notes must contain at least 30 characters." },
        { status: 400 }
      );
    }

    // Insert source metadata
    const { data: source, error: sourceError } = await serviceClient
      .from("sources")
      .insert({
        course_id: courseId,
        uploaded_by: user.id,
        filename: title,
        mime_type: "text/plain",
        storage_path: "pasted-notes",
        processing_status: "ready",
        page_count: 1,
      })
      .select()
      .single();

    if (sourceError || !source) {
      return NextResponse.json(
        { error: sourceError?.message || "Failed to save notes" },
        { status: 500 }
      );
    }

    // Chunk text using the chunker
    const chunks = chunkPages([{ pageNumber: 1, text }]);

    if (chunks.length > 0) {
      const chunkRows = chunks.map((c) => ({
        source_id: source.id,
        course_id: courseId,
        page_number: c.pageNumber,
        chunk_index: c.chunkIndex,
        text: c.text,
      }));

      await serviceClient.from("source_chunks").insert(chunkRows);
    }

    return NextResponse.json(
      {
        source: {
          ...source,
          chunk_count: chunks.length,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[sources/paste] Error:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
