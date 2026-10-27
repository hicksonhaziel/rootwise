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

  // For each citation, verify the quote exists in at least one chunk of that source
  const validated: ValidatedCitation[] = [];

  for (const citation of citations) {
    const filename = validSourceMap.get(citation.source_id);
    if (!filename) continue; // source_id doesn't exist / wrong course

    // Check if the quoted text appears in any chunk for this source
    const normalisedQuote = normalise(citation.quote);

    const { data: chunks } = await supabase
      .from("source_chunks")
      .select("text")
      .eq("source_id", citation.source_id)
      .limit(200); // safety cap

    const found = (chunks ?? []).some((chunk) =>
      normalise(chunk.text).includes(normalisedQuote)
    );

    if (found) {
      validated.push({ ...citation, source_filename: filename });
    }
  }

  return validated;
}
