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
} from "@phosphor-icons/react";

interface Source {
  id: string;
  filename: string;
  mime_type: string;
  storage_path: string;
  processing_status: string;
  processing_error: string | null;
  page_count: number | null;
  chunk_count?: number;
  created_at: string;
}

interface Chunk {
  id: string;
  page_number: number | null;
  chunk_index: number;
  text: string;
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

  // Chunk inspection modal
  const [inspectSource, setInspectSource] = useState<Source | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [chunksLoading, setChunksLoading] = useState(false);

  // Topic generation status
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [topicsSuccessMsg, setTopicsSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSources = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/courses/${courseId}/sources`);
      if (!res.ok) throw new Error("Failed to load materials");
      const data = await res.json();
      setSources(data.sources ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  async function handleFileUpload(file: File) {
    if (!file) return;
    setUploading(true);
    setScannedWarning(null);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/courses/${courseId}/sources`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.isScanned) {
          setScannedWarning(data.error || "This looks scanned. Rootwise needs a text PDF");
          await fetchSources();
          return;
        }
        throw new Error(data.error || "Upload failed");
      }

      await fetchSources();
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
      await fetchSources();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save notes";
      setUploadError(msg);
    } finally {
      setPasting(false);
    }
  }

  async function handleInspectChunks(source: Source) {
    setInspectSource(source);
    setChunksLoading(true);
    try {
      const res = await fetch(`/api/sources/${source.id}/chunks`);
      if (!res.ok) throw new Error("Failed to load chunks");
      const data = await res.json();
      setChunks(data.chunks ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setChunksLoading(false);
    }
  }

  async function handleGenerateTopics() {
    setGeneratingTopics(true);
    setTopicsSuccessMsg(null);
    setUploadError(null);

    try {
      const res = await fetch(`/api/courses/${courseId}/topics/generate`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to generate topics");

      setTopicsSuccessMsg(
        `Generated ${data.topics?.length ?? 0} topics successfully!`
      );
      if (onNavigateToTopics) {
        setTimeout(onNavigateToTopics, 1000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate topics";
      setUploadError(msg);
    } finally {
      setGeneratingTopics(false);
    }
  }

  const hasReadySources = sources.some((s) => s.processing_status === "ready");

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            Course Materials
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Upload text-based PDFs or paste notes. Rootwise extracts passages and creates study chunks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasReadySources && (
            <motion.button
              onClick={handleGenerateTopics}
              disabled={generatingTopics}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 px-3 py-2 bg-lime-300 text-text-inverse text-xs font-semibold rounded-md hover:bg-lime-400 disabled:opacity-50 transition-colors"
            >
              {generatingTopics ? (
                <>
                  <SpinnerGap size={14} className="animate-spin" />
                  Analyzing material…
                </>
              ) : (
                <>
                  <Sparkle size={14} weight="fill" />
                  Generate AI Topics
                </>
              )}
            </motion.button>
          )}

          <button
            onClick={() => setShowPasteMode(!showPasteMode)}
            className="flex items-center gap-1.5 px-3 py-2 bg-bg-surface border border-bg-border text-text-secondary hover:text-text-primary text-xs font-medium rounded-md transition-colors"
          >
            <Article size={14} />
            {showPasteMode ? "Upload PDF" : "Paste Notes"}
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
          className="p-3 bg-lime-300/10 border border-lime-300/20 rounded-lg flex items-center justify-between text-xs text-lime-300"
        >
          <span className="flex items-center gap-2">
            <CheckCircle size={16} weight="fill" />
            {topicsSuccessMsg}
          </span>
          {onNavigateToTopics && (
            <button
              onClick={onNavigateToTopics}
              className="underline font-medium hover:text-lime-400"
            >
              View Topic Map →
            </button>
          )}
        </motion.div>
      )}

      {/* Mode 1: PDF Dropzone */}
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
                ? "border-lime-300 bg-lime-300/5"
                : "border-bg-border hover:border-bg-border-focus bg-bg-surface/50"
            }
            ${uploading ? "opacity-60 cursor-not-allowed" : ""}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />

          <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
            <div className="w-10 h-10 rounded-full bg-bg-elevated border border-bg-border flex items-center justify-center text-lime-300">
              {uploading ? (
                <SpinnerGap size={20} className="animate-spin" />
              ) : (
                <FileArrowUp size={20} />
              )}
            </div>

            <p className="text-sm font-medium text-text-primary">
              {uploading ? "Extracting & indexing document…" : "Drop course PDF here or click to browse"}
            </p>
            <p className="text-xs text-text-tertiary">
              Text PDFs only (no scans). Lecture notes, syllabus, or past papers.
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
            <button
              type="button"
              onClick={() => setShowPasteMode(false)}
              className="text-text-tertiary hover:text-text-secondary"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-tertiary uppercase tracking-wider">
              Document Label
            </label>
            <input
              type="text"
              placeholder="e.g. Chapter 1: Calculus Limits"
              value={pastedTitle}
              onChange={(e) => setPastedTitle(e.target.value)}
              className="w-full bg-bg-elevated border border-bg-border rounded px-3 py-2 text-xs text-text-primary outline-none focus:border-lime-300"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-tertiary uppercase tracking-wider">
              Content *
            </label>
            <textarea
              rows={6}
              required
              placeholder="Paste notes, theorems, formulas, or lecture transcripts here…"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="w-full bg-bg-elevated border border-bg-border rounded p-3 text-xs text-text-primary font-mono outline-none focus:border-lime-300 resize-y"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowPasteMode(false)}
              className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pasting || pastedText.trim().length < 30}
              className="px-4 py-1.5 bg-lime-300 text-text-inverse text-xs font-semibold rounded hover:bg-lime-400 disabled:opacity-50"
            >
              {pasting ? "Chunking notes…" : "Save & Index Notes"}
            </button>
          </div>
        </form>
      )}

      {/* Sources list */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
          Uploaded Materials ({sources.length})
        </h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-text-tertiary">
            Loading materials…
          </div>
        ) : sources.length === 0 ? (
          <div className="card p-8 text-center">
            <FileText size={28} className="mx-auto text-text-tertiary mb-2" />
            <p className="text-xs text-text-secondary font-medium">No materials uploaded yet</p>
            <p className="text-[11px] text-text-tertiary mt-1">
              Upload course PDFs above to start diagnosing misconceptions.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className="card p-4 flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-bg-elevated rounded border border-bg-border text-text-secondary">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-medium text-text-primary truncate">
                      {source.filename}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-text-tertiary mt-0.5 font-mono">
                      {source.page_count !== null && (
                        <span>{source.page_count} {source.page_count === 1 ? "page" : "pages"}</span>
                      )}
                      {source.chunk_count !== undefined && (
                        <span>{source.chunk_count} chunks</span>
                      )}
                      <span>
                        {new Date(source.created_at).toLocaleDateString("en", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Status pill */}
                  {source.processing_status === "ready" && (
                    <span className="text-[11px] font-mono text-lime-300 bg-lime-300/10 border border-lime-300/20 px-2 py-0.5 rounded">
                      Ready
                    </span>
                  )}
                  {source.processing_status === "scanned" && (
                    <span className="text-[11px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
                      Scanned PDF
                    </span>
                  )}
                  {source.processing_status === "processing" && (
                    <span className="text-[11px] font-mono text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded flex items-center gap-1">
                      <SpinnerGap size={10} className="animate-spin" />
                      Processing
                    </span>
                  )}

                  {/* Chunks Inspector Button */}
                  {source.processing_status === "ready" && (
                    <button
                      onClick={() => handleInspectChunks(source)}
                      className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-elevated rounded transition-colors"
                      title="Inspect extracted chunks"
                    >
                      <Eye size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chunks Drawer/Modal */}
      <AnimatePresence>
        {inspectSource && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
              className="w-full max-w-xl h-full bg-bg-surface border-l border-bg-border p-6 flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-bg-border">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary truncate max-w-sm">
                      {inspectSource.filename}
                    </h3>
                    <p className="text-xs text-text-tertiary mt-0.5 font-mono">
                      {chunks.length} chunks indexed with FTS
                    </p>
                  </div>
                  <button
                    onClick={() => setInspectSource(null)}
                    className="p-1 text-text-tertiary hover:text-text-primary rounded"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-4 overflow-y-auto max-h-[calc(100vh-140px)] space-y-3 pr-1">
                  {chunksLoading ? (
                    <div className="py-12 text-center text-xs text-text-tertiary">
                      Loading chunks…
                    </div>
                  ) : chunks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-text-tertiary">
                      No chunks found.
                    </div>
                  ) : (
                    chunks.map((chunk) => (
                      <div
                        key={chunk.id}
                        className="p-3 bg-bg-elevated border border-bg-border rounded text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px] text-text-tertiary font-mono">
                          <span className="text-lime-300">Chunk #{chunk.chunk_index}</span>
                          {chunk.page_number && <span>Page {chunk.page_number}</span>}
                        </div>
                        <p className="text-text-secondary leading-relaxed font-sans whitespace-pre-wrap">
                          {chunk.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
