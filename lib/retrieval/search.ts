/**
 * lib/retrieval/search.ts
 *
 * Full-text retrieval over source_chunks for a given course.
 * Uses Postgres tsvector / GIN index (set up in the migration).
 *
 * Blueprint §9.4: "Start with dependable lexical search; add embeddings only if time allows."
 *
 * Returns top-K chunks sorted by relevance.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_LIMIT = 4; // blueprint says top 4

export interface RetrievedChunk {
  id: string;
  source_id: string;
  course_id: string;
  page_number: number | null;
  chunk_index: number;
  text: string;
}

/**
 * Search source_chunks for a course using full-text search.
 *
 * @param supabase  - server-side Supabase client
 * @param courseId  - restrict search to this course
 * @param query     - the user's question or topic text
 * @param limit     - max chunks to return (default 4)
 */
export async function searchChunks(
  supabase: SupabaseClient,
  courseId: string,
  query: string,
  limit: number = DEFAULT_LIMIT
): Promise<RetrievedChunk[]> {
  if (!query.trim()) return [];

  // Postgres full-text search via the stored tsvector column
  // The `fts` column is a tsvector generated from `text` (see migration)
  const { data, error } = await supabase
    .from("source_chunks")
    .select("id, source_id, course_id, page_number, chunk_index, text")
    .eq("course_id", courseId)
    .textSearch("fts", query, {
      type: "websearch",
      config: "english",
    })
    .limit(limit);

  if (error) {
    console.error("[retrieval/search] Full-text search error:", error);
    // Fallback: return most recent chunks so the session doesn't break
    const { data: fallback } = await supabase
      .from("source_chunks")
      .select("id, source_id, course_id, page_number, chunk_index, text")
      .eq("course_id", courseId)
      .limit(limit)
      .order("created_at", { ascending: false });
    return (fallback ?? []) as RetrievedChunk[];
  }

  return (data ?? []) as RetrievedChunk[];
}

/**
 * Retrieve all chunks for a specific source (used for topic outline generation).
 */
export async function getSourceChunks(
  supabase: SupabaseClient,
  sourceId: string,
  limit = 50
): Promise<RetrievedChunk[]> {
  const { data, error } = await supabase
    .from("source_chunks")
    .select("id, source_id, course_id, page_number, chunk_index, text")
    .eq("source_id", sourceId)
    .order("chunk_index", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[retrieval/search] getSourceChunks error:", error);
    return [];
  }

  return (data ?? []) as RetrievedChunk[];
}
