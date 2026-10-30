"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileArrowUp,
  FileText,
  WarningCircle,
  CheckCircle,
  SpinnerGap,
  Sparkle,
  Eye,
  X,
  Article,
  Image as ImageIcon,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { cachedFetch, cacheInvalidate } from "@/lib/cache";

interface Source {
  id: string;
  filename: string;
  mime_type: string;
  storage_path: string;
  processing_status: string;
  processing_error: string | null;
  page_count: number | null;
  chunk_count?: number;
  preview_url?: string | null;
  created_at: string;
}

interface Props {
  courseId: string;
  onNavigateToTopics?: () => void;
}

export function MaterialsTab({ courseId, onNavigateToTopics }: Props) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [scannedWarning, setScannedWarning] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Paste notes mode
  const [showPasteMode, setShowPasteMode] = useState(false);
  const [pastedTitle, setPastedTitle] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [pasting, setPasting] = useState(false);

  // In-App Document Preview Modal
  const [previewSource, setPreviewSource] = useState<Source | null>(null);

  // Topic generation status
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [topicsSuccessMsg, setTopicsSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSources = useCallback(
    async (force = false) => {
      try {
        setLoading(true);
        if (force) {
          cacheInvalidate(`/api/courses/${courseId}/sources`);
        }
        const data = await cachedFetch<{ sources: Source[] }>(
          `/api/courses/${courseId}/sources`
        );
        setSources(data.sources ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [courseId]
  );

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  async function handleFileUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    setScannedWarning(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/courses/${courseId}/sources`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.isScanned) {
          setScannedWarning(
            data.error || "This looks scanned. Rootwise needs a text PDF or photo."
          );
          await fetchSources(true);
          return;
        }
        throw new Error(data.error || "Upload failed");
      }

      await fetchSources(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadError(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handlePasteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pastedText.trim()) return;

    setPasting(true);
    setUploadError(null);

    try {
      const res = await fetch(`/api/courses/${courseId}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pastedTitle.trim() || "Pasted Lecture Notes",
          text: pastedText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save notes");

      setPastedText("");
      setPastedTitle("");
      setShowPasteMode(false);
      await fetchSources(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save notes";
      setUploadError(msg);
    } finally {
      setPasting(false);
    }
  }

  async function handleGenerateTopics() {
    setGeneratingTopics(true);
    setTopicsSuccessMsg(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/topics/generate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate topics");

      setTopicsSuccessMsg(
        `Generated ${data.topics?.length ?? 0} topics from your course materials!`
      );
      cacheInvalidate(`/api/courses/${courseId}/topics`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error generating topics";
      setUploadError(msg);
    } finally {
      setGeneratingTopics(false);
    }
  }

  function getFileIcon(filename: string, mime: string) {
    const lower = filename.toLowerCase();
    if (lower.endsWith(".pdf") || mime === "application/pdf") {
      return <FileText size={18} className="text-red-400" />;
    }
    if (lower.endsWith(".docx") || mime.includes("wordprocessingml")) {
      return <Article size={18} className="text-blue-400" />;
    }
    if (/\.(png|jpe?g|webp)$/i.test(lower) || mime.startsWith("image/")) {
      return <ImageIcon size={18} className="text-amber-400" />;
    }
    return <FileText size={18} className="text-text-tertiary" />;
  }

  function getFormatBadge(filename: string, mime: string) {
    const lower = filename.toLowerCase();
    if (lower.endsWith(".pdf") || mime === "application/pdf") {
      return <span className="text-[10px] font-mono font-medium text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20">PDF</span>;
    }
    if (lower.endsWith(".docx") || mime.includes("wordprocessingml")) {
      return <span className="text-[10px] font-mono font-medium text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">DOCX</span>;
    }
    if (/\.(png|jpe?g|webp)$/i.test(lower) || mime.startsWith("image/")) {
      return <span className="text-[10px] font-mono font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">PHOTO OCR</span>;
    }
    return <span className="text-[10px] font-mono font-medium text-zinc-400 bg-zinc-400/10 px-2 py-0.5 rounded border border-zinc-400/20">TEXT</span>;
  }

  const isPdf = previewSource ? previewSource.filename.toLowerCase().endsWith(".pdf") || previewSource.mime_type === "application/pdf" : false;
  const isImage = previewSource ? /\.(png|jpe?g|webp)$/i.test(previewSource.filename) || previewSource.mime_type.startsWith("image/") : false;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary">
            Course Materials & Uploads
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Upload PDFs, Word (.docx) documents, or photos of lecture notes and slides. Text is extracted and indexed for retrieval.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {sources.length > 0 && (
            <button
              onClick={handleGenerateTopics}
              disabled={generatingTopics}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              {generatingTopics ? (
                <SpinnerGap size={14} className="animate-spin" />
              ) : (
                <Sparkle size={14} />
              )}
              <span>{generatingTopics ? "Analyzing Outline…" : "Generate Topics"}</span>
            </button>
          )}

          <button
            onClick={() => setShowPasteMode(!showPasteMode)}
            className="btn-secondary text-xs"
          >
            {showPasteMode ? "Upload File instead" : "Paste Notes text"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {scannedWarning && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3"
        >
          <WarningCircle size={18} className="text-amber-400 mt-0.5 shrink-0" weight="fill" />
          <div className="text-xs">
            <p className="font-medium text-amber-300">Scanned Document Detected</p>
            <p className="text-amber-200/80 mt-0.5">{scannedWarning}</p>
          </div>
        </motion.div>
      )}

      {uploadError && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-xs text-red-400"
        >
          <WarningCircle size={16} weight="fill" />
          <span>{uploadError}</span>
        </motion.div>
      )}

      {topicsSuccessMsg && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-lime-500/10 dark:bg-lime-300/10 border border-lime-500/20 dark:border-lime-300/20 rounded-lg flex items-center justify-between text-xs text-lime-800 dark:text-lime-300 font-medium"
        >
          <span className="flex items-center gap-2">
            <CheckCircle size={16} weight="fill" />
            {topicsSuccessMsg}
          </span>
          {onNavigateToTopics && (
            <button
              onClick={onNavigateToTopics}
              className="underline font-semibold hover:text-lime-700 dark:hover:text-lime-400"
            >
              View Topic Map →
            </button>
          )}
        </motion.div>
      )}

      {/* Mode 1: Multi-Format Dropzone */}
      {!showPasteMode ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileUpload(file);
          }}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${
              dragActive
                ? "border-lime-500/50 dark:border-lime-300 bg-lime-500/5 dark:bg-lime-300/5"
                : "border-bg-border hover:border-lime-500/40 dark:hover:border-lime-300/30 bg-bg-surface/50"
            }
            ${uploading ? "opacity-60 cursor-not-allowed" : ""}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />

          <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-full bg-bg-elevated border border-bg-border flex items-center justify-center text-lime-700 dark:text-lime-300">
              {uploading ? (
                <SpinnerGap size={24} className="animate-spin" />
              ) : (
                <FileArrowUp size={24} />
              )}
            </div>

            <p className="text-sm font-medium text-text-primary">
              {uploading
                ? "Extracting & indexing document text…"
                : "Drop course files here or click to browse"}
            </p>
            <p className="text-xs text-text-tertiary">
              Supports <strong>PDF</strong>, Word <strong>.docx</strong>, and <strong>Photo/Slide OCR</strong> (.png, .jpg).
            </p>
          </div>
        </div>
      ) : (
        /* Mode 2: Paste notes */
        <form onSubmit={handlePasteSubmit} className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-primary">
              Paste Lecture or Textbook Excerpt
            </h3>
            <span className="text-[11px] text-text-tertiary font-mono">
              Min 30 characters
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-text-secondary">Section Title</label>
            <input
              type="text"
              placeholder="e.g. Chapter 3: Eigenvalues & Vector Spaces"
              value={pastedTitle}
              onChange={(e) => setPastedTitle(e.target.value)}
              className="input w-full text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-text-secondary">Notes Content</label>
            <textarea
              rows={8}
              placeholder="Paste notes, definitions, theorem statements, or past paper questions here..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="input w-full text-xs font-mono"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowPasteMode(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pasting || pastedText.trim().length < 30}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              {pasting ? <SpinnerGap size={14} className="animate-spin" /> : null}
              <span>{pasting ? "Indexing Notes…" : "Save & Index Notes"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Materials List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider font-mono">
            Indexed Course Documents ({sources.length})
          </h3>
        </div>

        {loading ? (
          <div className="card p-8 text-center text-xs text-text-tertiary">
            Loading course materials…
          </div>
        ) : sources.length === 0 ? (
          <div className="card p-8 text-center text-xs text-text-tertiary">
            No materials uploaded yet. Drop a PDF, Word document, or lecture photo above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sources.map((source) => (
              <div
                key={source.id}
                className="card p-4 flex flex-col justify-between space-y-3 hover:border-lime-500/30 transition-all group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {getFileIcon(source.filename, source.mime_type)}
                      <h4 className="text-xs font-medium text-text-primary truncate">
                        {source.filename}
                      </h4>
                    </div>
                    {getFormatBadge(source.filename, source.mime_type)}
                  </div>

                  <p className="text-[11px] text-text-tertiary font-mono">
                    {source.page_count ? `${source.page_count} page${source.page_count > 1 ? "s" : ""} • ` : ""}
                    Added {new Date(source.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="pt-2 border-t border-bg-border/60 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-lime-700 dark:text-lime-300 font-mono font-medium">
                    ✓ Indexed for AI Diagnosis
                  </span>

                  <button
                    onClick={() => setPreviewSource(source)}
                    className="btn-secondary px-2.5 py-1 text-[11px] flex items-center gap-1.5 hover:text-lime-700 dark:hover:text-lime-300"
                  >
                    <Eye size={13} />
                    <span>Preview Document</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* In-App Full Document Preview Modal (No Raw Chunks!) */}
      <AnimatePresence>
        {previewSource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-4xl max-h-[90vh] bg-bg-surface border border-bg-border rounded-xl p-5 flex flex-col justify-between overflow-hidden shadow-2xl space-y-4"
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-bg-border">
                <div className="flex items-center gap-3 min-w-0">
                  {getFileIcon(previewSource.filename, previewSource.mime_type)}
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary truncate max-w-md">
                      {previewSource.filename}
                    </h3>
                    <p className="text-[10px] text-text-tertiary font-mono">
                      In-App Document Preview • {previewSource.page_count ? `${previewSource.page_count} pages` : "Document"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {previewSource.preview_url && (
                    <a
                      href={previewSource.preview_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-text-tertiary hover:text-text-primary rounded hover:bg-bg-elevated transition-colors"
                      title="Open in new window"
                    >
                      <ArrowSquareOut size={16} />
                    </a>
                  )}
                  <button
                    onClick={() => setPreviewSource(null)}
                    className="p-1.5 text-text-tertiary hover:text-text-primary rounded hover:bg-bg-elevated transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Document Preview Content */}
              <div className="flex-1 overflow-auto min-h-[400px]">
                {previewSource.preview_url ? (
                  isPdf ? (
                    <iframe
                      src={previewSource.preview_url}
                      className="w-full h-[65vh] rounded-lg border border-bg-border bg-white"
                      title={previewSource.filename}
                    />
                  ) : isImage ? (
                    <div className="flex items-center justify-center h-[65vh] bg-bg-base/90 rounded-lg p-2 overflow-auto">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewSource.preview_url}
                        alt={previewSource.filename}
                        className="max-h-full max-w-full object-contain rounded-md shadow-lg"
                      />
                    </div>
                  ) : (
                    /* Word Document or other */
                    <div className="p-8 text-center bg-bg-elevated/40 border border-bg-border rounded-lg space-y-4 my-auto">
                      <Article size={48} className="mx-auto text-lime-400" />
                      <div>
                        <h4 className="text-base font-semibold text-text-primary">
                          {previewSource.filename}
                        </h4>
                        <p className="text-xs text-text-tertiary mt-1">
                          Word Document indexed and ready for AI diagnosis and learning.
                        </p>
                      </div>
                      <a
                        href={previewSource.preview_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4 font-semibold"
                      >
                        <FileText size={15} />
                        <span>Download / View Original File</span>
                      </a>
                    </div>
                  )
                ) : (
                  <div className="p-12 text-center text-xs text-text-tertiary">
                    Document preview is currently unavailable for this item.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
