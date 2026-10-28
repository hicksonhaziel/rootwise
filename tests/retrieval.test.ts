import { describe, it, expect, vi } from "vitest";
import { searchChunks, getSourceChunks } from "../lib/retrieval/search";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("lib/retrieval/search — searchChunks", () => {
  it("returns empty array for whitespace-only query without querying DB", async () => {
    const mockSupabase = {
      from: vi.fn(),
    } as unknown as SupabaseClient;

    const result = await searchChunks(mockSupabase, "course-123", "   ");
    expect(result).toEqual([]);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("queries Postgres FTS and returns matching chunks with page numbers for MTH101 terms", async () => {
    const mockChunks = [
      {
        id: "chunk-1",
        source_id: "src-1",
        course_id: "course-mth101",
        page_number: 14,
        chunk_index: 2,
        text: "By L'Hôpital's rule, if the limit of f(x)/g(x) produces an indeterminate form 0/0 or inf/inf, then lim f(x)/g(x) = lim f'(x)/g'(x).",
      },
      {
        id: "chunk-2",
        source_id: "src-1",
        course_id: "course-mth101",
        page_number: 15,
        chunk_index: 3,
        text: "Example: Compute limit as x approaches 0 of sin(x)/x. Applying derivatives gives cos(0)/1 = 1.",
      },
    ];

    const mockLimit = vi.fn().mockResolvedValue({ data: mockChunks, error: null });
    const mockTextSearch = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEq = vi.fn().mockReturnValue({ textSearch: mockTextSearch });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    const mockSupabase = {
      from: mockFrom,
    } as unknown as SupabaseClient;

    const query = "L'Hopital rule limit indeterminate";
    const results = await searchChunks(mockSupabase, "course-mth101", query, 4);

    expect(mockFrom).toHaveBeenCalledWith("source_chunks");
    expect(mockSelect).toHaveBeenCalledWith(
      "id, source_id, course_id, page_number, chunk_index, text"
    );
    expect(mockEq).toHaveBeenCalledWith("course_id", "course-mth101");
    expect(mockTextSearch).toHaveBeenCalledWith("fts", query, {
      type: "websearch",
      config: "english",
    });
    expect(mockLimit).toHaveBeenCalledWith(4);

    expect(results).toHaveLength(2);
    expect(results[0].page_number).toBe(14);
    expect(results[0].text).toContain("L'Hôpital's rule");
  });

  it("falls back to recent chunks if textSearch returns an error", async () => {
    const fallbackChunks = [
      {
        id: "fb-1",
        source_id: "src-1",
        course_id: "course-1",
        page_number: 1,
        chunk_index: 0,
        text: "Calculus introduction chunk",
      },
    ];

    const mockOrder = vi.fn().mockResolvedValue({ data: fallbackChunks, error: null });
    const mockFallbackLimit = vi.fn().mockReturnValue({ order: mockOrder });
    const mockFallbackEq = vi.fn().mockReturnValue({ limit: mockFallbackLimit });
    const mockFallbackSelect = vi.fn().mockReturnValue({ eq: mockFallbackEq });

    let callCount = 0;
    const mockFrom = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call: textSearch fails
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              textSearch: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "syntax error in tsquery" },
                }),
              }),
            }),
          }),
        };
      }
      // Second call: fallback
      return { select: mockFallbackSelect };
    });

    const mockSupabase = { from: mockFrom } as unknown as SupabaseClient;

    const results = await searchChunks(mockSupabase, "course-1", "syntax error ::: query", 4);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("fb-1");
  });

  it("getSourceChunks returns chunks for a given source ordered by chunk_index", async () => {
    const mockSourceChunks = [
      {
        id: "c-0",
        source_id: "src-99",
        course_id: "course-1",
        page_number: 1,
        chunk_index: 0,
        text: "Chapter 1 Introduction",
      },
    ];

    const mockLimit = vi.fn().mockResolvedValue({ data: mockSourceChunks, error: null });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    const mockSupabase = { from: mockFrom } as unknown as SupabaseClient;

    const results = await getSourceChunks(mockSupabase, "src-99", 50);
    expect(mockFrom).toHaveBeenCalledWith("source_chunks");
    expect(mockEq).toHaveBeenCalledWith("source_id", "src-99");
    expect(mockOrder).toHaveBeenCalledWith("chunk_index", { ascending: true });
    expect(results).toEqual(mockSourceChunks);
  });
});
