"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  PencilSimple,
  Trash,
  Check,
  X,
  Sparkle,
  SpinnerGap,
  Info,
  MapTrifold,
} from "@phosphor-icons/react";

interface Topic {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  created_by: "system" | "user";
  status?: string;
  confident_error?: boolean;
  created_at: string;
}

interface Props {
  courseId: string;
  onSelectTopicForDiagnostic?: (topicId: string) => void;
}

export function TopicsTab({ courseId, onSelectTopicForDiagnostic }: Props) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New topic modal / input
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [addingTopic, setAddingTopic] = useState(false);

  // Inline editing state
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);

  const isBusy = generating || savingEdit || addingTopic || Boolean(deletingTopicId);

  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/courses/${courseId}/topics`);
      if (!res.ok) throw new Error("Failed to load topics");
      const data = await res.json();
      setTopics(data.topics ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading topics";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  async function handleAddTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setAddingTopic(true);
    setError(null);

    try {
      const res = await fetch(`/api/courses/${courseId}/topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add topic");

      setTopics((prev) => [...prev, data.topic]);
      setNewTitle("");
      setNewDescription("");
      setShowAddForm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error adding topic";
      setError(msg);
    } finally {
      setAddingTopic(false);
    }
  }

  function startEditing(topic: Topic) {
    setEditingTopicId(topic.id);
    setEditTitle(topic.title);
    setEditDesc(topic.description || "");
  }

  function cancelEditing() {
    setEditingTopicId(null);
    setEditTitle("");
    setEditDesc("");
  }

  async function saveEditing(topicId: string) {
    if (!editTitle.trim()) return;
    setSavingEdit(true);

    try {
      const res = await fetch(`/api/courses/${courseId}/topics/${topicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDesc.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save topic");

      setTopics((prev) =>
        prev.map((t) => (t.id === topicId ? { ...t, ...data.topic } : t))
      );
      cancelEditing();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating topic";
      setError(msg);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteTopic(topicId: string) {
    if (!confirm("Are you sure you want to delete this topic?")) return;

    setDeletingTopicId(topicId);
    try {
      const res = await fetch(`/api/courses/${courseId}/topics/${topicId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete topic");

      setTopics((prev) => prev.filter((t) => t.id !== topicId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting topic";
      setError(msg);
    } finally {
      setDeletingTopicId(null);
    }
  }

  async function handleGenerateTopics() {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/courses/${courseId}/topics/generate`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate topics");

      await fetchTopics();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error generating topics";
      setError(msg);
    } finally {
      setGenerating(false);
    }
  }

  function getStatusBadge(status?: string, confidentError?: boolean) {
    if (confidentError) {
      return (
        <span className="text-[11px] font-mono text-status-wrong bg-status-wrong/10 border border-status-wrong/20 px-2 py-0.5 rounded">
          High Confidence Misconception
        </span>
      );
    }

    switch (status) {
      case "demonstrated":
        return (
          <span className="text-[11px] font-mono font-medium text-lime-700 dark:text-lime-300 bg-lime-500/10 dark:bg-lime-300/10 border border-lime-500/20 dark:border-lime-300/20 px-2 py-0.5 rounded">
            Demonstrated
          </span>
        );
      case "developing":
        return (
          <span className="text-[11px] font-mono text-status-developing bg-status-developing/10 border border-status-developing/20 px-2 py-0.5 rounded">
            Developing
          </span>
        );
      case "needs_work":
        return (
          <span className="text-[11px] font-mono text-status-wrong bg-status-wrong/10 border border-status-wrong/20 px-2 py-0.5 rounded">
            Needs Work
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-mono text-text-tertiary bg-bg-elevated px-2 py-0.5 rounded">
            Not Assessed
          </span>
        );
    }
  }

  return (
    <div className="space-y-6">
      {/* Official Disclaimer Banner (Blueprint & BUILD.md requirement) */}
      <div className="p-3 bg-bg-surface border border-bg-border rounded-lg flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Info size={16} className="text-lime-700 dark:text-lime-300 shrink-0" weight="fill" />
          <span>
            <strong>Suggested topics, not your official syllabus</strong> —
            Extracted from uploaded materials. You can edit, rename, add, or delete any topic.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAddForm(true)}
            disabled={generating}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-bg-elevated hover:bg-bg-border text-text-primary text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={13} weight="bold" />
            Add Topic
          </button>
          <button
            onClick={handleGenerateTopics}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-lime-300 text-[#0A0A0A] text-xs font-bold rounded hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {generating ? (
              <>
                <SpinnerGap size={13} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkle size={13} weight="fill" />
                AI Generate
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Add Topic Modal / Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleAddTopic}
            className="card p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                Add Custom Topic
              </h3>
              <button
                type="button"
                disabled={addingTopic}
                onClick={() => setShowAddForm(false)}
                className="text-text-tertiary hover:text-text-secondary disabled:opacity-50"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-text-tertiary">Topic Title *</label>
              <input
                type="text"
                required
                autoFocus
                disabled={addingTopic}
                placeholder="e.g. L'Hôpital's Rule & Indeterminate Forms"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-bg-elevated border border-bg-border rounded px-3 py-2 text-xs text-text-primary outline-none focus:border-lime-300 disabled:opacity-50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-text-tertiary">Description (optional)</label>
              <textarea
                rows={2}
                disabled={addingTopic}
                placeholder="Brief summary of concepts tested in this topic…"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full bg-bg-elevated border border-bg-border rounded px-3 py-2 text-xs text-text-primary outline-none focus:border-lime-300 resize-none disabled:opacity-50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={addingTopic}
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingTopic || !newTitle.trim()}
                className="px-4 py-1.5 bg-lime-300 text-[#0A0A0A] text-xs font-bold rounded hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {addingTopic ? "Adding…" : "Save Topic"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Topics list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            Topics in Course ({topics.length})
          </h3>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-text-tertiary">
            Loading topics…
          </div>
        ) : topics.length === 0 ? (
          <div className="card p-8 text-center">
            <MapTrifold size={28} className="mx-auto text-text-tertiary mb-2" />
            <p className="text-xs text-text-secondary font-medium">No topics defined yet</p>
            <p className="text-[11px] text-text-tertiary mt-1">
              Upload course PDFs in the Materials tab, then click &ldquo;AI Generate&rdquo; or add topics manually.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {topics.map((topic) => {
              const isEditing = editingTopicId === topic.id;

              return (
                <div
                  key={topic.id}
                  className="card p-4 flex flex-col gap-2 group transition-all"
                >
                  {isEditing ? (
                    /* Inline edit mode */
                    <div className="space-y-3">
                      <input
                        type="text"
                        disabled={savingEdit}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-bg-elevated border border-lime-300 rounded px-2.5 py-1.5 text-xs text-text-primary outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <textarea
                        rows={2}
                        disabled={savingEdit}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full bg-bg-elevated border border-bg-border rounded px-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-lime-300 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={savingEdit}
                          onClick={cancelEditing}
                          className="px-2.5 py-1 text-xs text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={savingEdit || !editTitle.trim()}
                          onClick={() => saveEditing(topic.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-lime-300 text-text-inverse text-xs font-semibold rounded hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingEdit ? (
                            <SpinnerGap size={13} className="animate-spin" />
                          ) : (
                            <Check size={13} weight="bold" />
                          )}
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal display mode */
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-medium text-text-primary">
                            {topic.title}
                          </h4>
                          {getStatusBadge(topic.status, topic.confident_error)}
                          {topic.created_by === "system" && (
                            <span className="text-[10px] text-text-tertiary bg-bg-elevated px-1.5 py-0.5 rounded font-mono">
                              AI Suggested
                            </span>
                          )}
                        </div>
                        {topic.description && (
                          <p className="text-xs text-text-secondary line-clamp-2">
                            {topic.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {onSelectTopicForDiagnostic && (
                          <button
                            disabled={isBusy}
                            onClick={() => onSelectTopicForDiagnostic(topic.id)}
                            className="px-2.5 py-1 bg-bg-elevated hover:bg-bg-border text-lime-700 dark:text-lime-300 text-xs font-semibold rounded transition-colors mr-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Diagnose →
                          </button>
                        )}

                        <button
                          disabled={isBusy}
                          onClick={() => startEditing(topic)}
                          className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-elevated rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Rename / edit topic"
                        >
                          <PencilSimple size={14} />
                        </button>
                        <button
                          disabled={isBusy}
                          onClick={() => handleDeleteTopic(topic.id)}
                          className="p-1.5 text-text-tertiary hover:text-red-400 hover:bg-bg-elevated rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete topic"
                        >
                          {deletingTopicId === topic.id ? (
                            <SpinnerGap size={14} className="animate-spin text-text-tertiary" />
                          ) : (
                            <Trash size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
