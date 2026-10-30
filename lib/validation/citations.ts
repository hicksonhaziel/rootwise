/**
 * lib/validation/citations.ts
 *
 * Citation validator (BUILD.md step 2.4)
 *
 * Checks:
 *  1. source_id exists in the DB for this course
 *  2. The quoted text is present in the stored chunk (after whitespace normalisation)
 *
 * Returns only citations that pass BOTH checks.
 * If none survive → caller shows "Not enough support in your notes"
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { RawCitation } from "@/lib/ai/schemas";

// ---------------------------------------------------------------------------
// Normalise whitespace for fuzzy-ish substring match
// ---------------------------------------------------------------------------

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[""'']/g, '"')
    .trim();
}

// ---------------------------------------------------------------------------
// Validated citation type (source confirmed in DB)
// ---------------------------------------------------------------------------

export interface ValidatedCitation extends RawCitation {
  source_filename: string;
}

// ---------------------------------------------------------------------------
// Main validator
// ---------------------------------------------------------------------------

export async function validateCitations(
  supabase: SupabaseClient,
  courseId: string,
  citations: RawCitation[]
): Promise<ValidatedCitation[]> {
  if (!citations.length) return [];

  // Batch fetch all source_ids being cited
  const sourceIds = [...new Set(citations.map((c) => c.source_id))];

  const { data: sources, error } = await supabase
    .from("sources")
    .select("id, filename, course_id")
    .in("id", sourceIds);

  if (error) {
    console.error("[citation-validator] DB error fetching sources:", error);
    return [];
  }

  // Build a set of valid source IDs for this course
  const validSourceMap = new Map<string, string>(
    (sources ?? [])
      .filter((s) => s.course_id === courseId)
      .map((s) => [s.id, s.filename])
  );

  // Batch fetch all chunks for valid sources in ONE single DB query
  const validSourceIds = [...validSourceMap.keys()];
  if (!validSourceIds.length) return [];

  const { data: chunks, error: chunksError } = await supabase
    .from("source_chunks")
    .select("source_id, page_number, text")
    .in("source_id", validSourceIds)
    .limit(500);

  if (chunksError) {
    console.error("[citation-validator] DB error fetching chunks:", chunksError);
    return [];
  }

  // Index chunks by source_id in memory
  const chunkMap = new Map<string, Array<{ page_number: number | null; text: string }>>();
  for (const c of chunks ?? []) {
    const list = chunkMap.get(c.source_id) ?? [];
    list.push({ page_number: c.page_number, text: c.text });
    chunkMap.set(c.source_id, list);
  }

  // Verify quotes and page numbers in memory
  const validated: ValidatedCitation[] = [];

  for (const citation of citations) {
    const filename = validSourceMap.get(citation.source_id);
    if (!filename) continue; // source_id doesn't exist / wrong course

    const sourceChunks = chunkMap.get(citation.source_id) ?? [];
    const normalisedQuote = normalise(citation.quote);

    const found = sourceChunks.some((chunk) => {
      const quoteMatches = normalise(chunk.text).includes(normalisedQuote);
      const pageMatches =
        citation.page === null ||
        citation.page === undefined ||
        chunk.page_number === null ||
        chunk.page_number === citation.page;
      return quoteMatches && pageMatches;
    });

    if (found) {
      validated.push({ ...citation, source_filename: filename });
    }
  }

  return validated;
}
