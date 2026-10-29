"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Brain,
  Clock,
  ArrowRight,
  ThumbsDown,
  SpinnerGap,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface AttemptRecord {
  id: string;
  attempt_type: string;
  question_text: string;
  student_answer: string;
  confidence: string;
  diagnosis_category: string | null;
  assessment: string;
  assessment_json: Record<string, unknown> | null;
  diagnosis_rejected: boolean;
  confident_error: boolean;
  created_at: string;
}

interface TopicProgress {
  status: string;
  status_reason: string;
  confident_error: boolean;
  recheck_due_at: string | null;
  last_attempt_at: string | null;
}

interface Props {
  courseId: string;
  topicId: string | null;
  onClose: () => void;
  onDiagnose: (topicId: string) => void;
}

export function AttemptDrawer({
  courseId,
  topicId,
  onClose,
  onDiagnose,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState<{ id: string; title: string; description: string | null } | null>(null);
  const [progress, setProgress] = useState<TopicProgress | null>(null);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!topicId) return;

    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/courses/${courseId}/topics/${topicId}/attempts`);
        if (!res.ok) throw new Error("Failed to load attempt history");
        const data = await res.json();
        if (isMounted) {
          setTopic(data.topic);
          setProgress(data.progress);
          setAttempts(data.attempts ?? []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error loading attempts");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [courseId, topicId]);

  if (!topicId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
          className="relative w-full max-w-xl h-full bg-bg-surface border-l border-bg-border p-6 flex flex-col justify-between overflow-hidden shadow-2xl z-10"
        >
          {/* Top Header */}
          <div className="flex items-start justify-between pb-4 border-b border-bg-border gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono uppercase tracking-wider text-text-tertiary">
                  Topic Details & History
                </span>
                {progress?.confident_error && (
                  <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.2 rounded font-mono">
                    Confident Error Knot
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold text-text-primary truncate">
                {topic?.title || "Loading topic…"}
              </h3>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-text-tertiary hover:text-text-primary rounded-md hover:bg-bg-elevated transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-text-tertiary text-xs">
                <SpinnerGap size={20} className="animate-spin text-lime-700 dark:text-lime-300" />
                <span>Loading attempt records…</span>
              </div>
            ) : error ? (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-lg">
                {error}
              </div>
            ) : (
              <>
                {/* Status Rationale Box (BUILD.md §3.1) */}
                <div className="card p-4 space-y-2 bg-bg-elevated/40 border-bg-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Current Status Rationale
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-mono font-medium px-2 py-0.5 rounded border",
                        progress?.status === "demonstrated"
                          ? "bg-lime-500/10 border-lime-500/20 text-lime-700 dark:text-lime-300"
                          : progress?.status === "developing"
                          ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          : progress?.status === "needs_work"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : "bg-bg-elevated border-bg-border text-text-tertiary"
                      )}
                    >
                      {progress?.status ? progress.status.replace(/_/g, " ") : "not assessed"}
                    </span>
                  </div>
                  <p className="text-xs text-text-primary leading-relaxed">
                    {progress?.status_reason || "No diagnosis attempts have been recorded for this topic yet."}
                  </p>
                  {progress?.recheck_due_at && (
                    <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary pt-1">
                      <Clock size={13} className="text-amber-400" />
                      <span>Recheck scheduled for: {new Date(progress.recheck_due_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Attempt History List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                    Diagnostic Attempts ({attempts.length})
                  </h4>

                  {attempts.length === 0 ? (
                    <div className="card p-8 text-center text-xs text-text-tertiary space-y-2">
                      <Brain size={24} className="mx-auto opacity-40" />
                      <p>No attempts recorded for this topic.</p>
                      <p className="text-[11px]">Take a diagnostic question to begin evaluating misconceptions.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {attempts.map((att, i) => (
                        <div
                          key={att.id}
                          className="card p-4 space-y-3 hover:border-bg-border/80 transition-colors"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-[11px] text-text-tertiary">
                              Attempt #{attempts.length - i} · {att.attempt_type}
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "text-[10px] font-mono px-1.5 py-0.5 rounded border",
                                  att.assessment === "correct"
                                    ? "bg-lime-500/10 border-lime-500/20 text-lime-700 dark:text-lime-300"
                                    : att.assessment === "partial"
                                    ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                    : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                )}
                              >
                                {att.assessment}
                              </span>
                              <span className="text-[10px] font-mono bg-bg-elevated px-1.5 py-0.5 rounded text-text-secondary">
                                {att.confidence}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-text-primary">
                              Q: {att.question_text}
                            </p>
                            <p className="text-xs text-text-secondary bg-bg-elevated/70 p-2.5 rounded-md italic">
                              &ldquo;{att.student_answer}&rdquo;
                            </p>
                          </div>

                          {att.diagnosis_category && (
                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-bg-border/60">
                              <span className="text-text-tertiary">
                                Category:{" "}
                                <span className="text-text-secondary font-medium">
                                  {att.diagnosis_category.replace(/_/g, " ")}
                                </span>
                              </span>
                              {att.diagnosis_rejected && (
                                <span className="text-amber-400 flex items-center gap-1">
                                  <ThumbsDown size={11} />
                                  Rejected by student
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="pt-4 border-t border-bg-border flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-bg-elevated text-xs font-medium text-text-secondary rounded-lg hover:text-text-primary transition-colors"
            >
              Close
            </button>

            <button
              onClick={() => {
                onClose();
                onDiagnose(topicId);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-lime-300 text-text-inverse text-xs font-bold rounded-lg hover:bg-lime-400 transition-colors shadow-sm"
            >
              <span>Diagnose Topic</span>
              <ArrowRight size={13} weight="bold" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
