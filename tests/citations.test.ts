import { describe, it, expect, vi } from "vitest";
import { validateCitations } from "../lib/validation/citations";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RawCitation } from "../lib/ai/schemas";

function createMockSupabase(sourcesData: any[], chunksMap: Record<string, string[]>) {
  return {
    from: vi.fn((table: string) => {
      if (table === "sources") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockImplementation((_col: string, ids: string[]) => {
              const matched = sourcesData.filter((s) => ids.includes(s.id));
              return Promise.resolve({ data: matched, error: null });
            }),
          }),
        };
      }

      if (table === "source_chunks") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((_col: string, sourceId: string) => {
              const chunks = (chunksMap[sourceId] ?? []).map((text) => ({ text }));
              return {
                limit: vi.fn().mockResolvedValue({ data: chunks, error: null }),
              };
            }),
          }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    }),
  } as unknown as SupabaseClient;
}

describe("lib/validation/citations — validateCitations", () => {
  const courseId = "00000000-0000-0000-0000-000000000001";
  const validSourceId = "11111111-1111-1111-1111-111111111111";
  const wrongCourseSourceId = "22222222-2222-2222-2222-222222222222";

  const mockSources = [
    {
      id: validSourceId,
      filename: "MTH101_Lecture_01.pdf",
      course_id: courseId,
    },
    {
      id: wrongCourseSourceId,
      filename: "PHY101_Notes.pdf",
      course_id: "other-course-id",
    },
  ];

  const mockChunks: Record<string, string[]> = {
    [validSourceId]: [
      "The limit of sin(x)/x as x approaches 0 equals 1 by the Squeeze Theorem.",
      "A continuous function has no jumps, breaks, or holes in its domain interval.",
    ],
  };

  it("returns empty array for empty citations", async () => {
    const supabase = createMockSupabase(mockSources, mockChunks);
    const result = await validateCitations(supabase, courseId, []);
    expect(result).toEqual([]);
  });

  it("passes citations with real matching quote and attaches source_filename", async () => {
    const supabase = createMockSupabase(mockSources, mockChunks);
    const citations: RawCitation[] = [
      {
        source_id: validSourceId,
        page: 3,
        quote: "limit of sin(x)/x as x approaches 0 equals 1",
      },
    ];

    const result = await validateCitations(supabase, courseId, citations);
    expect(result).toHaveLength(1);
    expect(result[0].source_id).toBe(validSourceId);
    expect(result[0].source_filename).toBe("MTH101_Lecture_01.pdf");
    expect(result[0].page).toBe(3);
  });

  it("drops citations with hallucinated or invented quotes", async () => {
    const supabase = createMockSupabase(mockSources, mockChunks);
    const citations: RawCitation[] = [
      {
        source_id: validSourceId,
        page: 3,
        quote: "The derivative of sin(x) is guaranteed to always be negative.",
      },
    ];

    const result = await validateCitations(supabase, courseId, citations);
    expect(result).toHaveLength(0);
  });

  it("drops citations pointing to non-existent source_id", async () => {
    const supabase = createMockSupabase(mockSources, mockChunks);
    const citations: RawCitation[] = [
      {
        source_id: "99999999-9999-9999-9999-999999999999",
        page: 1,
        quote: "The limit of sin(x)/x as x approaches 0 equals 1",
      },
    ];

    const result = await validateCitations(supabase, courseId, citations);
    expect(result).toHaveLength(0);
  });

  it("drops citations pointing to a source belonging to another course", async () => {
    const supabase = createMockSupabase(mockSources, mockChunks);
    const citations: RawCitation[] = [
      {
        source_id: wrongCourseSourceId,
        page: 1,
        quote: "Some quote text from another course",
      },
    ];

    const result = await validateCitations(supabase, courseId, citations);
    expect(result).toHaveLength(0);
  });

  it("handles whitespace and punctuation normalization cleanly", async () => {
    const supabase = createMockSupabase(mockSources, mockChunks);
    const citations: RawCitation[] = [
      {
        source_id: validSourceId,
        page: 4,
        quote: "A   continuous  function\nhas no jumps, breaks,  or holes",
      },
    ];

    const result = await validateCitations(supabase, courseId, citations);
    expect(result).toHaveLength(1);
    expect(result[0].source_id).toBe(validSourceId);
  });
});
