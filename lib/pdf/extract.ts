/**
 * lib/pdf/extract.ts
 *
 * PDF text extraction with page-boundary preservation.
 * Uses `unpdf` — a lightweight, serverless-compatible PDF parser.
 *
 * Blueprint §1.2:
 *  - Store file in Supabase Storage
 *  - Extract text per page
 *  - Scanned PDFs (no text layer) → clear user error, not silent success
 */

import { extractText, getDocumentProxy } from "unpdf";

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractionResult {
  pages: ExtractedPage[];
  totalPages: number;
  isScanned: boolean;
}

const MIN_CHARS_PER_PAGE = 30; // below this we consider a page empty/scanned
const SCANNED_PAGE_THRESHOLD = 0.7; // if >70% of pages are empty → scanned

/**
 * Extract text from a PDF buffer, preserving page numbers.
 * Returns { pages, totalPages, isScanned }
 */
export async function extractPdfText(buffer: ArrayBuffer): Promise<ExtractionResult> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { totalPages, text } = await extractText(pdf, { mergePages: false });

  const textArray = Array.isArray(text) ? text : [text];
  const pages: ExtractedPage[] = textArray.map((pageText, idx) => ({
    pageNumber: idx + 1,
    text: normalisePageText(pageText),
  }));

  const emptyPageCount = pages.filter(
    (p) => p.text.length < MIN_CHARS_PER_PAGE
  ).length;

  const isScanned =
    totalPages > 0 && emptyPageCount / totalPages >= SCANNED_PAGE_THRESHOLD;

  return { pages, totalPages, isScanned };
}

// ---------------------------------------------------------------------------
// Chunker: ~500 tokens with overlap
// ---------------------------------------------------------------------------

export interface TextChunk {
  pageNumber: number | null;
  chunkIndex: number;
  text: string;
}

const CHUNK_TARGET_CHARS = 1800; // ~450 tokens at 4 chars/token
const OVERLAP_CHARS = 200;

/**
 * Split extracted pages into overlapping chunks for storage and retrieval.
 * Chunks stay within a single page where possible.
 */
export function chunkPages(pages: ExtractedPage[]): TextChunk[] {
  const chunks: TextChunk[] = [];
  let globalIndex = 0;

  for (const page of pages) {
    if (page.text.length < MIN_CHARS_PER_PAGE) continue;

    // Split page into paragraphs first, then combine into target-size chunks
    const paragraphs = page.text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    let buffer = "";

    for (const para of paragraphs) {
      if (buffer.length + para.length > CHUNK_TARGET_CHARS && buffer.length > 0) {
        chunks.push({
          pageNumber: page.pageNumber,
          chunkIndex: globalIndex++,
          text: buffer.trim(),
        });
        // Overlap: keep last N chars of previous chunk
        buffer = buffer.slice(-OVERLAP_CHARS) + "\n\n" + para;
      } else {
        buffer = buffer ? buffer + "\n\n" + para : para;
      }
    }

    // Flush remaining buffer
    if (buffer.trim().length >= MIN_CHARS_PER_PAGE) {
      chunks.push({
        pageNumber: page.pageNumber,
        chunkIndex: globalIndex++,
        text: buffer.trim(),
      });
    }
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalisePageText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
