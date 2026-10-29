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
import mammoth from "mammoth";
import { aiClient } from "@/lib/ai/provider";

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
export async function extractPdfText(buffer: ArrayBuffer | Uint8Array): Promise<ExtractionResult> {
  // Always clone buffer to prevent pdfjs/unpdf worker transfer from detaching caller's ArrayBuffer
  const uint8 =
    buffer instanceof Uint8Array
      ? buffer.slice()
      : new Uint8Array(buffer.slice(0));

  const pdf = await getDocumentProxy(uint8);
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

/**
 * Extract text from a Word document (.docx) buffer using mammoth.
 */
export async function extractDocxText(buffer: Buffer): Promise<ExtractionResult> {
  const result = await mammoth.extractRawText({ buffer });
  const rawText = normalisePageText(result.value || "");

  if (!rawText || rawText.length < MIN_CHARS_PER_PAGE) {
    return { pages: [], totalPages: 0, isScanned: false };
  }

  // Partition into logical ~2000 character pages
  const paragraphs = rawText.split(/\n{2,}/);
  const pages: ExtractedPage[] = [];
  let currentPage = "";
  let pageNum = 1;

  for (const para of paragraphs) {
    if (currentPage.length + para.length > 2000 && currentPage.length > 0) {
      pages.push({ pageNumber: pageNum++, text: currentPage.trim() });
      currentPage = para;
    } else {
      currentPage = currentPage ? currentPage + "\n\n" + para : para;
    }
  }

  if (currentPage.trim().length > 0) {
    pages.push({ pageNumber: pageNum, text: currentPage.trim() });
  }

  return {
    pages,
    totalPages: pages.length,
    isScanned: false,
  };
}

/**
 * Transcribe lecture image / photo notes into text using Groq Vision (llama-3.2-11b-vision-preview).
 */
export async function extractImageText(buffer: Buffer, mimeType: string): Promise<ExtractionResult> {
  const base64 = buffer.toString("base64");
  const effectiveMime = mimeType || "image/jpeg";

  try {
    const response = await aiClient.chat.completions.create({
      model: "llama-3.2-11b-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "You are an expert OCR transcription engine for university lecture materials. Transcribe all text, formulas, math notations, diagram captions, definitions, and handwritten notes from this image accurately and verbatim. Maintain logical layout.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${effectiveMime};base64,${base64}`,
              },
            },
          ],
        },
      ],
      temperature: 0.1,
    });

    const ocrText = normalisePageText(response.choices[0]?.message?.content || "");
    return {
      pages: ocrText.length > 0 ? [{ pageNumber: 1, text: ocrText }] : [],
      totalPages: 1,
      isScanned: false,
    };
  } catch (err) {
    console.warn("[ocr/vision] Vision model transcription error, fallback:", err);
    return {
      pages: [],
      totalPages: 1,
      isScanned: true,
    };
  }
}
