"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  CheckCircle,
  WarningCircle,
  Lightbulb,
  Quotes,
  ArrowRight,
  ArrowsClockwise,
  ThumbsDown,
  SpinnerGap,
  Sparkle,
  BookOpen,
  Info,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface Topic {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  status?: string;
  confident_error?: boolean;
}

interface Citation {
  source_id: string;
  source_filename?: string;
  page: number | null;
  quote: string;
}

interface BeliefSimulation {
  implied_belief: string;
  consequence: string;
  why_it_breaks: string;
}

interface DiagnosisResult {
  assessment: "correct" | "partial" | "incorrect" | "insufficient";
  what_seems_correct: string[];
  possible_gap: {
    category: string;
    description: string;
  };
  explanation: string;
  next_step: {
    kind: string;
    text: string;
  };
  belief_simulation?: BeliefSimulation | null;
  prerequisite_topic_id?: string | null;
  follow_up_question: string;
  citations: Citation[];
}

interface ProgressResult {
  status: string;
  status_reason: string;
  confident_error: boolean;
  recheck_due_at: string | null;
}

interface Props {
  courseId: string;
  initialTopicId?: string | null;
  onNavigateToTopics?: () => void;
}

type ConfidenceLevel = "sure" | "think_so" | "guessing";

export function DiagnosticSession({
  courseId,
  initialTopicId,
  onNavigateToTopics,
}: Props) {
  // Topics & current selection
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(
    initialTopicId ?? null
  );
  const [loadingTopics, setLoadingTopics] = useState(true);

  // Question state
  const [question, setQuestion] = useState<string | null>(null);
  const [contextHint, setContextHint] = useState<string | null>(null);
  const [questionCitations, setQuestionCitations] = useState<Citation[]>([]);
  const [generatingQuestion, setGeneratingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);

  // Student answer state
  const [studentAnswer, setStudentAnswer] = useState("");
  const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null);
  const [attemptType, setAttemptType] = useState<"initial" | "follow_up">("initial");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Diagnosis feedback state
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressResult | null>(null);
  const [prerequisiteTopic, setPrerequisiteTopic] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [rejected, setRejected] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  // Fetch topics on mount
  const fetchTopics = useCallback(async () => {
    try {
      setLoadingTopics(true);
      const res = await fetch(`/api/courses/${courseId}/topics`);
      if (!res.ok) throw new Error("Failed to load topics");
      const data = await res.json();
      const list = data.topics ?? [];
      setTopics(list);

      // If initialTopicId was passed and is valid, use it; otherwise pick first topic
      if (initialTopicId && list.some((t: Topic) => t.id === initialTopicId)) {
        setSelectedTopicId(initialTopicId);
      } else if (list.length > 0 && !selectedTopicId) {
        setSelectedTopicId(list[0].id);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoadingTopics(false);
    }
  }, [courseId, initialTopicId, selectedTopicId]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // Sync when initialTopicId prop updates
  useEffect(() => {
    if (initialTopicId) {
      setSelectedTopicId(initialTopicId);
    }
  }, [initialTopicId]);

  // Generate question when selected topic changes
  const generateQuestionForTopic = useCallback(
    async (topicId: string, customQuestion?: string) => {
      if (customQuestion) {
        setQuestion(customQuestion);
        setContextHint("Follow-up test for the same core concept.");
        setStudentAnswer("");
        setConfidence(null);
        setDiagnosis(null);
        setProgress(null);
        setRejected(false);
        return;
      }

      setGeneratingQuestion(true);
      setQuestionError(null);
      setQuestion(null);
      setDiagnosis(null);
      setProgress(null);
      setStudentAnswer("");
      setConfidence(null);
      setRejected(false);
      setAttemptType("initial");

      try {
        const res = await fetch(`/api/courses/${courseId}/diagnostics/question`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to generate question");

        setQuestion(data.question);
        setContextHint(data.context_hint || null);
        setQuestionCitations(data.citations ?? []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error generating question";
        setQuestionError(msg);
      } finally {
        setGeneratingQuestion(false);
      }
    },
    [courseId]
  );

  useEffect(() => {
    if (selectedTopicId) {
      generateQuestionForTopic(selectedTopicId);
    }
  }, [selectedTopicId, generateQuestionForTopic]);

  // Submit Answer & Run Diagnosis
  async function handleSubmitAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!studentAnswer.trim() || !confidence || !selectedTopicId || !question) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/courses/${courseId}/diagnostics/assess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: selectedTopicId,
          question,
          studentAnswer: studentAnswer.trim(),
          confidence,
          attemptType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze answer");

      setDiagnosis(data.diagnosis);
      setCurrentAttemptId(data.attempt?.id || null);
      setProgress(data.progress);
      setPrerequisiteTopic(data.prerequisiteTopic || null);

      // Refresh topics so topic status pills update in real-time
      fetchTopics();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error analyzing answer";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // Reject Diagnosis
  async function handleRejectDiagnosis() {
    if (!currentAttemptId) return;
    setRejecting(true);

    try {
      const res = await fetch(
        `/api/courses/${courseId}/attempts/${currentAttemptId}/reject`,
        { method: "PATCH" }
      );
      if (res.ok) {
        setRejected(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRejecting(false);
    }
  }

  // Start Retest
  function handleStartRetest() {
    if (!diagnosis?.follow_up_question) return;
    setAttemptType("follow_up");
    setQuestion(diagnosis.follow_up_question);
    setContextHint("Follow-up attempt — proving the concept fix stuck.");
    setStudentAnswer("");
    setConfidence(null);
    setDiagnosis(null);
    setProgress(null);
    setRejected(false);
  }

  const selectedTopic = topics.find((t) => t.id === selectedTopicId);

  // If no topics exist in the course yet
  if (!loadingTopics && topics.length === 0) {
    return (
      <div className="card p-10 text-center max-w-xl mx-auto space-y-4">
        <Brain size={36} className="mx-auto text-text-tertiary" />
        <h3 className="text-base font-semibold text-text-primary">
          No topics available for diagnosis
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          Upload course PDFs in the Materials tab or create topics in the Topic Map first.
          Rootwise needs syllabus topics and course notes to generate diagnostic questions.
        </p>
        {onNavigateToTopics && (
          <button
            onClick={onNavigateToTopics}
            className="px-4 py-2 bg-lime-300 text-text-inverse text-xs font-bold rounded-lg hover:bg-lime-400 transition-colors inline-flex items-center gap-1.5"
          >
            Go to Topic Map
            <ArrowRight size={13} weight="bold" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Topic Switcher & Progress Bar */}
      <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-lime-500/10 dark:bg-lime-300/10 border border-lime-500/20 dark:border-lime-300/20 flex items-center justify-center text-lime-700 dark:text-lime-300">
            <Brain size={18} weight="bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-text-tertiary">
                Diagnostic Topic
              </span>
              {selectedTopic?.confident_error && (
                <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.2 rounded font-mono">
                  Confident Error Knot
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                value={selectedTopicId || ""}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                disabled={generatingQuestion || submitting}
                className="bg-bg-elevated border border-bg-border rounded px-2.5 py-1 text-xs font-semibold text-text-primary outline-none focus:border-lime-300 cursor-pointer disabled:opacity-50"
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              "text-[11px] font-mono font-medium px-2.5 py-1 rounded border",
              selectedTopic?.status === "demonstrated"
                ? "bg-lime-500/10 dark:bg-lime-300/10 border-lime-500/20 dark:border-lime-300/20 text-lime-700 dark:text-lime-300"
                : selectedTopic?.status === "developing"
                ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                : selectedTopic?.status === "needs_work"
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                : "bg-bg-elevated border-bg-border text-text-tertiary"
            )}
          >
            {selectedTopic?.status === "demonstrated"
              ? "Demonstrated ✓"
              : selectedTopic?.status === "developing"
              ? "Developing"
              : selectedTopic?.status === "needs_work"
              ? "Needs Work"
              : "Not Assessed"}
          </span>

          <button
            onClick={() => selectedTopicId && generateQuestionForTopic(selectedTopicId)}
            disabled={generatingQuestion || submitting}
            className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-elevated rounded transition-colors disabled:opacity-50"
            title="Generate a new question for this topic"
          >
            <ArrowsClockwise
              size={15}
              className={cn(generatingQuestion && "animate-spin")}
            />
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Question & Feedback on Left, Source Citations on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* Left Column: Interactive Diagnostic Workspace */}
        <div className="space-y-6">
          {/* Question Box */}
          <div className="card p-6 relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-bg-elevated text-text-secondary border border-bg-border">
                  {attemptType === "initial" ? "Step 1 of 2: Diagnostic" : "Step 2 of 2: Retest"}
                </span>
                {attemptType === "follow_up" && (
                  <span className="text-[10px] font-mono text-lime-700 dark:text-lime-300 bg-lime-500/10 dark:bg-lime-300/10 border border-lime-500/20 px-2 py-0.5 rounded">
                    Linked Follow-Up
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono text-text-tertiary">
                Grounded in notes
              </span>
            </div>

            {generatingQuestion ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                <SpinnerGap size={24} className="animate-spin text-lime-700 dark:text-lime-300" />
                <p className="text-xs text-text-secondary font-medium">
                  Retrieving course notes and formulating diagnostic question…
                </p>
                <p className="text-[11px] text-text-tertiary">
                  Targeting deep understanding, not surface recall.
                </p>
              </div>
            ) : questionError ? (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-start gap-2.5">
                <WarningCircle size={16} className="shrink-0 mt-0.5" weight="fill" />
                <div className="space-y-2">
                  <p>{questionError}</p>
                  <button
                    onClick={() => selectedTopicId && generateQuestionForTopic(selectedTopicId)}
                    className="px-3 py-1 bg-bg-elevated hover:bg-bg-border text-text-primary rounded text-xs font-medium"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : question ? (
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-semibold text-text-primary leading-snug">
                  {question}
                </h3>
                {contextHint && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary bg-bg-elevated/60 px-3 py-2 rounded-md border border-bg-border/60">
                    <Info size={14} className="text-lime-700 dark:text-lime-300 shrink-0" />
                    <span>{contextHint}</span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Answer Form (Hidden once diagnosed unless in retest) */}
            {question && !diagnosis && (
              <form onSubmit={handleSubmitAnswer} className="space-y-5 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Your Reasoning
                    </label>
                    <span className="text-[11px] text-text-tertiary">
                      English, Pidgin, or mixed is welcome
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    disabled={submitting}
                    value={studentAnswer}
                    onChange={(e) => setStudentAnswer(e.target.value)}
                    placeholder="Explain in your own words why this happens or what steps you would take…"
                    className="w-full bg-bg-elevated border border-bg-border rounded-xl p-3.5 text-xs sm:text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-lime-300 resize-y disabled:opacity-50 transition-colors"
                  />
                </div>

                {/* Confidence Tap Buttons (BUILD.md §2.2) */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                    How confident are you? *
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      {
                        id: "sure" as const,
                        label: "Sure",
                        sub: "Ready to bet on it",
                        badge: "✓",
                      },
                      {
                        id: "think_so" as const,
                        label: "Think so",
                        sub: "Reasonably sure",
                        badge: "?",
                      },
                      {
                        id: "guessing" as const,
                        label: "Guessing",
                        sub: "Uncertain intuition",
                        badge: "🎲",
                      },
                    ].map((opt) => {
                      const isSelected = confidence === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={submitting}
                          onClick={() => setConfidence(opt.id)}
                          className={cn(
                            "p-2.5 sm:p-3 rounded-lg border text-left transition-all disabled:opacity-50",
                            isSelected
                              ? "bg-lime-500/10 dark:bg-lime-300/10 border-lime-600 dark:border-lime-300 ring-1 ring-lime-500/30"
                              : "bg-bg-elevated border-bg-border hover:border-bg-border/80"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                "text-xs font-bold",
                                isSelected
                                  ? "text-lime-700 dark:text-lime-300"
                                  : "text-text-primary"
                              )}
                            >
                              {opt.label}
                            </span>
                            <span className="text-xs font-mono">{opt.badge}</span>
                          </div>
                          <p className="text-[10px] text-text-tertiary mt-0.5 truncate hidden sm:block">
                            {opt.sub}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {submitError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center gap-2">
                    <WarningCircle size={15} weight="fill" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <p className="text-[11px] text-text-tertiary">
                    {!confidence
                      ? "Select confidence above to submit"
                      : "We diagnose your reasoning, not grammar."}
                  </p>

                  <button
                    type="submit"
                    disabled={submitting || !studentAnswer.trim() || !confidence}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-lime-300 text-text-inverse text-xs font-bold rounded-lg hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {submitting ? (
                      <>
                        <SpinnerGap size={14} className="animate-spin" />
                        Diagnosing reasoning…
                      </>
                    ) : (
                      <>
                        Submit Answer
                        <ArrowRight size={13} weight="bold" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Diagnostic Assessment Screen (BUILD.md §2.6) */}
          <AnimatePresence>
            {diagnosis && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }}
                className="space-y-4"
              >
                {/* 1. Top Assessment Banner */}
                <div
                  className={cn(
                    "p-4 rounded-xl border flex items-center justify-between",
                    diagnosis.assessment === "correct"
                      ? "bg-lime-500/10 border-lime-500/25 text-lime-800 dark:text-lime-300"
                      : diagnosis.assessment === "partial"
                      ? "bg-blue-500/10 border-blue-500/25 text-blue-400"
                      : diagnosis.assessment === "insufficient"
                      ? "bg-bg-elevated border-bg-border text-text-secondary"
                      : "bg-amber-500/10 border-amber-500/25 text-amber-400"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkle size={18} weight="fill" />
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {diagnosis.assessment === "correct"
                          ? "Sound Reasoning"
                          : diagnosis.assessment === "partial"
                          ? "Partially Correct Reasoning"
                          : diagnosis.assessment === "insufficient"
                          ? "Insufficient Evidence"
                          : "Misconception Identified"}
                      </span>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        {diagnosis.possible_gap.description}
                      </p>
                    </div>
                  </div>

                  {progress && (
                    <span className="text-xs font-mono font-medium px-2.5 py-1 rounded bg-bg-surface/80 border border-bg-border text-text-primary">
                      Status: {progress.status}
                    </span>
                  )}
                </div>

                {/* 2. What You Got Right (BUILD.md §2.6) */}
                {diagnosis.what_seems_correct.length > 0 && (
                  <div className="card p-4 space-y-2 border-l-4 border-l-lime-500 dark:border-l-lime-400">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-lime-700 dark:text-lime-400 flex items-center gap-1.5">
                      <CheckCircle size={15} weight="fill" />
                      What you got right
                    </h4>
                    <ul className="space-y-1.5 text-xs text-text-secondary">
                      {diagnosis.what_seems_correct.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-lime-600 dark:text-lime-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 3. Possible Gap & Grounded Explanation */}
                <div className="card p-4 space-y-2 border-l-4 border-l-amber-500">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Lightbulb size={15} weight="fill" />
                      Possible gap
                    </h4>
                    <span className="text-[10px] font-mono text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                      {diagnosis.possible_gap.category.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {diagnosis.explanation}
                  </p>
                </div>

                {/* 4. Wrong-Belief Simulator (BUILD.md §2.5 [WOW moment]) */}
                {diagnosis.belief_simulation && (
                  <div className="card p-5 space-y-3 border-l-4 border-l-red-500 bg-red-500/5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                      <WarningCircle size={15} weight="fill" />
                      Where it breaks (Belief Simulation)
                    </h4>
                    <p className="text-[11px] text-text-tertiary">
                      If your underlying assumption was applied universally, here is the domino effect:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 font-sans text-xs">
                      {/* Step 1: Implied Belief */}
                      <div className="bg-bg-elevated p-3 rounded-lg border border-bg-border space-y-1">
                        <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                          1. Implied Belief
                        </span>
                        <p className="text-text-primary text-xs leading-relaxed">
                          {diagnosis.belief_simulation.implied_belief}
                        </p>
                      </div>

                      {/* Step 2: Consequence */}
                      <div className="bg-bg-elevated p-3 rounded-lg border border-bg-border space-y-1">
                        <span className="text-[10px] font-mono text-orange-400 uppercase tracking-wider block">
                          2. Consequence
                        </span>
                        <p className="text-text-primary text-xs leading-relaxed">
                          {diagnosis.belief_simulation.consequence}
                        </p>
                      </div>

                      {/* Step 3: Why it Breaks */}
                      <div className="bg-bg-elevated p-3 rounded-lg border border-red-500/30 space-y-1 bg-red-500/5">
                        <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider block font-bold">
                          3. Why It Breaks
                        </span>
                        <p className="text-text-primary text-xs leading-relaxed font-medium">
                          {diagnosis.belief_simulation.why_it_breaks}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Root Trace (BUILD.md §2.9) */}
                {prerequisiteTopic && (
                  <div className="card p-4 space-y-3 border border-purple-500/30 bg-purple-500/5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                        <Brain size={15} weight="bold" />
                        Root Trace: Missing Prerequisite
                      </h4>
                      <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                        Foundation Gap
                      </span>
                    </div>

                    <p className="text-xs text-text-secondary">
                      This misconception stems from an earlier concept:{" "}
                      <strong className="text-text-primary">{prerequisiteTopic.title}</strong>.
                      We recommend mastering the foundation before continuing with this topic.
                    </p>

                    <button
                      onClick={() => setSelectedTopicId(prerequisiteTopic.id)}
                      className="px-3 py-1.5 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      Diagnose Prerequisite: {prerequisiteTopic.title}
                      <ArrowRight size={12} weight="bold" />
                    </button>
                  </div>
                )}

                {/* 6. Try this next / Suggestion */}
                {diagnosis.next_step && (
                  <div className="card p-4 space-y-1.5 bg-bg-surface border-bg-border">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-text-tertiary">
                      Try this next ({diagnosis.next_step.kind})
                    </span>
                    <p className="text-xs text-text-secondary">
                      {diagnosis.next_step.text}
                    </p>
                  </div>
                )}

                {/* 7. Action Bar: Reject & Retest Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  {/* Rejection button (BUILD.md §2.6) */}
                  <div>
                    {rejected ? (
                      <span className="text-xs text-text-tertiary italic">
                        Feedback noted. Diagnosis marked as unrepresentative.
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={rejecting}
                        onClick={handleRejectDiagnosis}
                        className="text-xs text-text-tertiary hover:text-text-secondary flex items-center gap-1.5 py-1 px-2 rounded hover:bg-bg-elevated transition-colors disabled:opacity-50"
                      >
                        <ThumbsDown size={14} />
                        {rejecting ? "Saving feedback…" : "This doesn't describe my thinking"}
                      </button>
                    )}
                  </div>

                  {/* Retest Loop button (BUILD.md §2.7) */}
                  <button
                    type="button"
                    onClick={handleStartRetest}
                    className="w-full sm:w-auto px-5 py-2.5 bg-lime-300 text-text-inverse text-xs font-bold rounded-lg hover:bg-lime-400 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>Test with Follow-Up Question</span>
                    <ArrowRight size={13} weight="bold" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Source Evidence & Verified Citations Rail */}
        <div className="space-y-4">
          <div className="card p-5 space-y-3 sticky top-20">
            <div className="flex items-center justify-between border-b border-bg-border pb-3">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Quotes size={15} className="text-lime-700 dark:text-lime-300" weight="fill" />
                Source Evidence
              </h4>
              <span className="text-[10px] font-mono text-text-tertiary">
                Verified against notes
              </span>
            </div>

            {/* Display citations from either active diagnosis or initial question */}
            {(() => {
              const activeCitations = diagnosis ? diagnosis.citations : questionCitations;

              if (activeCitations.length === 0) {
                return (
                  <div className="py-6 text-center text-xs text-text-tertiary">
                    <BookOpen size={24} className="mx-auto mb-2 opacity-50" />
                    <p>Not enough direct support in notes for specific excerpts.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {activeCitations.map((cit, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-bg-elevated/70 border border-bg-border rounded-lg space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-lime-700 dark:text-lime-300">
                        <span className="truncate max-w-[180px]">
                          {cit.source_filename || "Course Material"}
                        </span>
                        {cit.page !== null && <span>Page {cit.page}</span>}
                      </div>
                      <blockquote className="text-text-secondary italic pl-2 border-l-2 border-lime-500/40 dark:border-lime-300/40 text-[11px] leading-relaxed">
                        &ldquo;{cit.quote}&rdquo;
                      </blockquote>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="pt-2 border-t border-bg-border/60">
              <p className="text-[10px] text-text-tertiary leading-normal">
                Every citation is verified against stored chunks in Postgres. Hallucinated quotes are dropped automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
