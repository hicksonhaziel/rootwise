import { describe, it, expect } from "vitest";
import { chunkPages, type ExtractedPage } from "../lib/pdf/extract";

describe("lib/pdf/extract — chunkPages", () => {
  it("returns empty array for empty pages", () => {
    const chunks = chunkPages([]);
    expect(chunks).toEqual([]);
  });

  it("skips pages with less than MIN_CHARS_PER_PAGE", () => {
    const pages: ExtractedPage[] = [
      { pageNumber: 1, text: "   " },
      { pageNumber: 2, text: "Too short" },
    ];
    const chunks = chunkPages(pages);
    expect(chunks).toEqual([]);
  });

  it("chunks a single page with enough content", () => {
    const text =
      "Calculus I: Limits and Continuity.\n\n" +
      "The limit of a function at a point describes the behavior of the function near that point.\n\n" +
      "Let f be a function defined on an open interval containing c, except possibly at c itself.\n\n" +
      "We say that the limit of f(x) as x approaches c is L, written lim_{x->c} f(x) = L.";

    const pages: ExtractedPage[] = [{ pageNumber: 1, text }];
    const chunks = chunkPages(pages);

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].pageNumber).toBe(1);
    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[0].text).toContain("Calculus I");
  });

  it("preserves page numbers correctly across multiple pages", () => {
    const pages: ExtractedPage[] = [
      {
        pageNumber: 1,
        text: "Page 1 Content: Derivatives measure the instantaneous rate of change of a function with respect to one of its variables. For example, velocity is the derivative of position.",
      },
      {
        pageNumber: 2,
        text: "Page 2 Content: Integration is the reverse process of differentiation. The Fundamental Theorem of Calculus links derivatives and integrals.",
      },
    ];

    const chunks = chunkPages(pages);
    expect(chunks.length).toBe(2);
    expect(chunks[0].pageNumber).toBe(1);
    expect(chunks[1].pageNumber).toBe(2);
    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[1].chunkIndex).toBe(1);
  });

  it("splits long content into multiple chunks with overlap", () => {
    // Generate long text > 2000 chars with multiple paragraphs
    const paragraphs = Array.from({ length: 15 }, (_, i) =>
      `Paragraph ${i + 1}: In mathematics, a continuous function is a function such that a continuous variation (that is, a change without jump) of the argument induces a continuous variation of the value of the function.`
    );
    const longText = paragraphs.join("\n\n");

    const pages: ExtractedPage[] = [{ pageNumber: 3, text: longText }];
    const chunks = chunkPages(pages);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.pageNumber === 3)).toBe(true);
    // Indices must be sequential
    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i].chunkIndex).toBe(i);
    }
  });

  it("does not detach caller ArrayBuffer", async () => {
    const { extractPdfText } = await import("../lib/pdf/extract");
    const buffer = new ArrayBuffer(64);
    expect(buffer.byteLength).toBe(64);
    try {
      await extractPdfText(buffer);
    } catch {
      // Expected PDF parse error on empty/dummy bytes
    }
    expect(buffer.byteLength).toBe(64);
  });
});
