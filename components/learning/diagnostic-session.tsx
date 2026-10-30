"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  CheckCircle,
  XCircle,
  WarningCircle,
  Lightbulb,
  Quotes,
  ArrowRight,
  ArrowsClockwise,
  SpinnerGap,
  Sparkle,
  BookOpen,
  GraduationCap,
  MathOperations,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { StudyGuide } from "@/lib/ai/schemas";

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
  page?: number | null;
  quote: string;
}

interface AssessmentResult {
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
  belief_simulation?: {
    implied_belief: string;
    consequence: string;
    why_it_breaks: string;
  } | null;
  prerequisite_topic_id?: string | null;
  follow_up_question: string;
  citations: Citation[];
}

interface TopicProgress {
  status: string;
  status_reason: string;
  confident_error: boolean;
  recheck_due_at?: string | null;
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

  // Study Guide Masterclass state
  const [studyGuide, setStudyGuide] = useState<StudyGuide | null>(null);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [guideError, setGuideError] = useState<string | null>(null);
  const [topicProgress, setTopicProgress] = useState<TopicProgress | null>(null);

  // Diagnostic Check Multiple-Choice Answer state
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null);
  const [submittingCheck, setSubmittingCheck] = useState(false);
  const [submitStage, setSubmitStage] = useState<"reading" | "citations">("reading");
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch topics list
  const fetchTopics = useCallback(async () => {
    try {
      setLoadingTopics(true);
      const res = await fetch(`/api/courses/${courseId}/topics`);
      if (!res.ok) throw new Error("Failed to load topics");
      const data = await res.json();
      const list = data.topics ?? [];
      setTopics(list);

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

  useEffect(() => {
    if (initialTopicId) {
      setSelectedTopicId(initialTopicId);
    }
  }, [initialTopicId]);

  // Fetch Masterclass Study Guide when topic changes
  const loadStudyGuide = useCallback(
    async (topicId: string) => {
      setLoadingGuide(true);
      setGuideError(null);
      setStudyGuide(null);
      setSelectedOption(null);
      setConfidence(null);
      setAssessmentResult(null);
      setSubmitError(null);

      try {
        const res = await fetch(
          `/api/courses/${courseId}/topics/${topicId}/study-guide`
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load topic masterclass");
        }
        setStudyGuide(data.studyGuide);
        setTopicProgress(data.progress || null);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Error loading study guide";
        setGuideError(msg);
      } finally {
        setLoadingGuide(false);
      }
    },
    [courseId]
  );

  useEffect(() => {
    if (selectedTopicId) {
      loadStudyGuide(selectedTopicId);
    }
  }, [selectedTopicId, loadStudyGuide]);

  // Submit Multiple-Choice Concept Check
  async function handleVerifyUnderstanding() {
    if (!studyGuide || !selectedOption || !confidence || !selectedTopicId) return;

    setSubmittingCheck(true);
    setSubmitStage("reading");
    setSubmitError(null);

    const stageTimer = setTimeout(() => {
      setSubmitStage("citations");
    }, 2500);

    const check = studyGuide.diagnostic_check;
    const selectedObj = check.options.find((o) => o.key === selectedOption);
    const studentAnswerText = `Option ${selectedOption}: ${selectedObj?.text || ""}`;

    try {
      const res = await fetch(`/api/courses/${courseId}/diagnostics/assess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: selectedTopicId,
          question: check.question,
          studentAnswer: studentAnswerText,
          confidence,
          attemptType: "initial",
          studyCheck: {
            selectedOption,
            correctOption: check.correct_option,
            distractorMisconceptions: check.distractor_misconceptions,
            rationale: check.rationale,
            beliefSimulation: check.belief_simulation || null,
            citations: check.citations || [],
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assess answer");

      setAssessmentResult(data.diagnosis);
      setTopicProgress(data.progress);

      // Refresh topics so topic status pill updates in navbar
      fetchTopics();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error verifying answer";
      setSubmitError(msg);
    } finally {
      clearTimeout(stageTimer);
      setSubmittingCheck(false);
    }
  }

  // Advance to next topic
  function handleNextTopic() {
    const currentIndex = topics.findIndex((t) => t.id === selectedTopicId);
    if (currentIndex >= 0 && currentIndex < topics.length - 1) {
      setSelectedTopicId(topics[currentIndex + 1].id);
    }
  }

  const selectedTopic = topics.find((t) => t.id === selectedTopicId);
  const currentStatus = topicProgress?.status || selectedTopic?.status || "not_assessed";
  const hasConfidentError = topicProgress?.confident_error || selectedTopic?.confident_error;

  // If no topics exist in the course yet
  if (!loadingTopics && topics.length === 0) {
    return (
      <div className="card p-10 text-center max-w-xl mx-auto space-y-4">
        <Brain size={36} className="mx-auto text-zinc-500" />
        <h3 className="text-base font-semibold text-zinc-100">
          No topics available for study
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Upload course notes in the Materials tab or create topics in the Topic Map first.
          Rootwise synthesizes your syllabus into intuitive full-page masterclasses.
        </p>
        {onNavigateToTopics && (
          <button
            onClick={onNavigateToTopics}
            className="px-4 py-2 bg-lime-300 text-black text-xs font-bold rounded-lg hover:bg-lime-400 transition-colors inline-flex items-center gap-1.5"
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
      {/* Top Topic Switcher & Status Bar */}
      <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-bg-border bg-bg-surface">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-center text-lime-400">
            <GraduationCap size={20} weight="bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Topic Masterclass
              </span>
              {hasConfidentError && (
                <span className="text-[10px] bg-red-500/10 border border-red-500/30 text-red-400 px-2 py-0.5 rounded font-mono font-medium">
                  ⚠️ Confident Error Knot
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                value={selectedTopicId || ""}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                disabled={loadingGuide || submittingCheck}
                className="bg-bg-elevated border border-bg-border rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-100 outline-none focus:border-lime-400 cursor-pointer disabled:opacity-50 max-w-[220px] sm:max-w-xs truncate"
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
              "text-[11px] font-mono font-semibold px-3 py-1 rounded-full border",
              currentStatus === "demonstrated"
                ? "bg-lime-500/15 border-lime-500/40 text-lime-300"
                : currentStatus === "developing"
                ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                : currentStatus === "needs_work"
                ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                : "bg-bg-elevated border-zinc-800 text-zinc-400"
            )}
          >
            {currentStatus === "demonstrated"
              ? "Demonstrated ✓"
              : currentStatus === "developing"
              ? "Developing"
              : currentStatus === "needs_work"
              ? "Needs Work"
              : "Not Assessed"}
          </span>

          <button
            onClick={() => selectedTopicId && loadStudyGuide(selectedTopicId)}
            disabled={loadingGuide || submittingCheck}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-bg-elevated rounded-lg transition-colors disabled:opacity-50 border border-transparent hover:border-zinc-800"
            title="Re-synthesize this study guide"
          >
            <ArrowsClockwise
              size={16}
              className={cn(loadingGuide && "animate-spin text-lime-400")}
            />
          </button>
        </div>
      </div>

      {/* Main Grid: Comprehensive Study Guide on Left, Source Citations on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Left Column: Full-Page Masterclass Guide */}
        <div className="space-y-6">
          {loadingGuide ? (
            <div className="card p-16 flex flex-col items-center justify-center gap-4 text-center">
              <SpinnerGap size={36} className="animate-spin text-lime-400" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-zinc-100">
                  Synthesizing Topic Masterclass…
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm">
                  Grounding explanations, extracting core formulas, and mapping common student traps from your lecture notes.
                </p>
              </div>
            </div>
          ) : guideError ? (
            <div className="card p-6 bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-3">
              <WarningCircle size={20} className="shrink-0 mt-0.5" weight="fill" />
              <div className="space-y-3">
                <p className="font-medium">{guideError}</p>
                <button
                  onClick={() => selectedTopicId && loadStudyGuide(selectedTopicId)}
                  className="px-4 py-1.5 bg-bg-elevated hover:bg-bg-border text-zinc-100 rounded-lg text-xs font-semibold"
                >
                  Retry Synthesis
                </button>
              </div>
            </div>
          ) : studyGuide ? (
            <div className="space-y-6">
              {/* 1. Topic Masterclass Header Banner */}
              <div className="card p-7 border-bg-border bg-gradient-to-b from-bg-surface to-bg-elevated/40 space-y-3">
                <div className="flex items-center gap-2 text-[11px] font-mono text-lime-400">
                  <Sparkle size={14} weight="fill" />
                  <span>AI Comprehensive Study Guide</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight leading-tight">
                  {selectedTopic?.title}
                </h1>
                {selectedTopic?.description && (
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">
                    {selectedTopic.description}
                  </p>
                )}
              </div>

              {/* 2. 🎓 Core Concept & Intuition */}
              <div className="card p-6 border-bg-border bg-bg-surface space-y-3">
                <div className="flex items-center gap-2 text-lime-400 text-xs font-bold uppercase tracking-wider">
                  <Lightbulb size={18} weight="fill" />
                  <span>Core Concept & Intuition</span>
                </div>
                <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed space-y-3 font-sans">
                  {studyGuide.core_concept.split("\n\n").map((para, i) => (
                    <p key={i} className="leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
              </div>

              {/* 3. 📐 Key Rules & Formulas */}
              <div className="card p-6 border-bg-border bg-bg-surface space-y-3">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  <MathOperations size={18} weight="bold" />
                  <span>Key Rules & Fundamental Formulas</span>
                </div>
                <div className="grid grid-cols-1 gap-2.5 pt-1">
                  {studyGuide.key_rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-bg-base/80 rounded-xl border border-zinc-800/80 flex items-start gap-3 text-xs leading-relaxed"
                    >
                      <span className="w-5 h-5 rounded-md bg-cyan-500/10 text-cyan-400 font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-zinc-200 font-medium">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. ⚠️ Common Traps & Misconceptions */}
              <div className="card p-6 border-amber-500/30 bg-amber-500/5 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <WarningCircle size={18} weight="fill" />
                  <span>Exam Pitfalls & Common Misconceptions</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  These are subtle traps university professors frequently use in test questions:
                </p>
                <div className="grid grid-cols-1 gap-2.5 pt-1">
                  {studyGuide.pitfalls.map((pitfall, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-bg-base/90 rounded-xl border border-amber-500/20 flex items-start gap-3 text-xs leading-relaxed"
                    >
                      <span className="text-amber-400 font-bold shrink-0 mt-0.5">⚠️</span>
                      <span className="text-zinc-300">{pitfall}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. 📝 Step-by-Step Worked Problem */}
              <div className="card p-6 border-bg-border bg-bg-surface space-y-4">
                <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                  <BookOpen size={18} weight="fill" />
                  <span>Step-by-Step Worked Example</span>
                </div>

                <div className="p-4 bg-bg-base rounded-xl border border-zinc-800 space-y-2">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">
                    Problem Statement
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-zinc-100 leading-snug">
                    {studyGuide.worked_example.problem}
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">
                    Solution Walkthrough
                  </span>
                  <div className="space-y-2">
                    {studyGuide.worked_example.solution_steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-bg-elevated/40 rounded-xl border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed flex items-start gap-2.5"
                      >
                        <span className="text-purple-400 font-bold">•</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-300 flex items-start gap-2">
                  <Sparkle size={16} className="shrink-0 mt-0.5 text-purple-400" weight="fill" />
                  <p>
                    <strong className="text-purple-200">Key Takeaway: </strong>
                    {studyGuide.worked_example.key_takeaway}
                  </p>
                </div>
              </div>

              {/* 6. 🎯 1-Minute Concept Mastery Self-Check (Multiple-Choice A, B, C, D) */}
              <div className="card p-6 border-lime-500/30 bg-gradient-to-b from-bg-surface to-bg-elevated/30 space-y-5">
                <div className="flex items-center justify-between border-b border-bg-border pb-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-lime-400 uppercase tracking-wider font-semibold">
                      Diagnostic Check
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-zinc-100">
                      Test Your Understanding (Select A, B, C, or D)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    No typing required
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-zinc-200 leading-relaxed">
                  {studyGuide.diagnostic_check.question}
                </p>

                {/* 4 Interactive Option Cards */}
                <div className="grid grid-cols-1 gap-2.5">
                  {studyGuide.diagnostic_check.options.map((opt) => {
                    const isSelected = selectedOption === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        disabled={submittingCheck || Boolean(assessmentResult)}
                        onClick={() => setSelectedOption(opt.key)}
                        className={cn(
                          "p-3.5 rounded-xl border text-left flex items-start gap-3.5 transition-all text-xs leading-relaxed disabled:opacity-75",
                          isSelected
                            ? "bg-lime-500/15 border-lime-400 ring-1 ring-lime-400/40 text-zinc-100 shadow-sm"
                            : "bg-bg-base/70 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-bg-base"
                        )}
                      >
                        <span
                          className={cn(
                            "w-6 h-6 rounded-lg font-mono font-bold flex items-center justify-center text-xs shrink-0 transition-colors",
                            isSelected
                              ? "bg-lime-400 text-black font-extrabold"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          )}
                        >
                          {opt.key}
                        </span>
                        <span className={cn("pt-0.5", isSelected ? "font-semibold text-zinc-100" : "text-zinc-300")}>
                          {opt.text}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Confidence Tap Buttons */}
                {!assessmentResult && (
                  <div className="space-y-2 pt-2 border-t border-bg-border/60">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        How confident are you? *
                      </label>
                      <span className="text-[11px] font-mono text-zinc-500">
                        Detects high-confidence knots
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: "sure" as const, label: "Sure", sub: "100% certain", icon: "✓" },
                        { id: "think_so" as const, label: "Think so", sub: "Reasonably sure", icon: "?" },
                        { id: "guessing" as const, label: "Guessing", sub: "Uncertain intuition", icon: "🎲" },
                      ].map((opt) => {
                        const isSelected = confidence === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={submittingCheck}
                            onClick={() => setConfidence(opt.id)}
                            className={cn(
                              "p-3 rounded-xl border text-left transition-all disabled:opacity-50",
                              isSelected
                                ? "bg-lime-500/15 border-lime-400 ring-1 ring-lime-400/40 text-zinc-100"
                                : "bg-bg-base/70 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className={cn("text-xs font-bold", isSelected ? "text-lime-300" : "text-zinc-200")}>
                                {opt.label}
                              </span>
                              <span className="text-xs font-mono">{opt.icon}</span>
                            </div>
                            <p className="text-[10px] text-zinc-500 mt-0.5 truncate hidden sm:block">
                              {opt.sub}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {submitError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                    <WarningCircle size={16} weight="fill" />
                    <span>{submitError}</span>
                  </div>
                )}

                {!assessmentResult && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={submittingCheck || !selectedOption || !confidence}
                      onClick={handleVerifyUnderstanding}
                      className={cn(
                        "px-6 py-2.5 bg-lime-300 hover:bg-lime-400 text-black text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-[0.98]",
                        (!selectedOption || !confidence || submittingCheck) &&
                          "opacity-40 cursor-not-allowed hover:bg-lime-300"
                      )}
                    >
                      {submittingCheck ? (
                        <>
                          <SpinnerGap size={15} className="animate-spin" />
                          <span>
                            {submitStage === "reading"
                              ? "Reading your notes…"
                              : "Checking citations against notes…"}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>Verify Understanding</span>
                          <ArrowRight size={14} weight="bold" />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Assessment Feedback Banner (Shown after submission) */}
                <AnimatePresence>
                  {assessmentResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 pt-4 border-t border-bg-border"
                    >
                      <div
                        className={cn(
                          "p-4 rounded-xl border flex items-center justify-between",
                          assessmentResult.assessment === "correct"
                            ? "bg-lime-500/10 border-lime-500/30 text-lime-300"
                            : "bg-red-500/10 border-red-500/30 text-red-300"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {assessmentResult.assessment === "correct" ? (
                            <CheckCircle size={22} weight="fill" className="text-lime-400 shrink-0" />
                          ) : (
                            <XCircle size={22} weight="fill" className="text-red-400 shrink-0" />
                          )}
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider block">
                              {assessmentResult.assessment === "correct"
                                ? "Sound Conceptual Understanding! ✓"
                                : "Misconception Trap Sprung"}
                            </span>
                            <p className="text-xs opacity-90 mt-0.5">
                              {assessmentResult.possible_gap.description}
                            </p>
                          </div>
                        </div>

                        {topicProgress && (
                          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-bg-surface border border-bg-border text-zinc-200">
                            Status: {topicProgress.status}
                          </span>
                        )}
                      </div>

                      {/* Official Rationale & Explanation */}
                      <div className="card p-4 space-y-2 border-l-4 border-l-lime-400 bg-bg-surface">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-lime-400 font-bold block">
                          Course Rationale & Insight
                        </span>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {assessmentResult.explanation}
                        </p>
                      </div>

                      {/* Wrong-Belief Simulator Dominoes (BUILD.md §2.5) */}
                      {assessmentResult.belief_simulation && (
                        <div className="card p-4 space-y-3 border-l-4 border-l-red-500 bg-red-950/10">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                              <WarningCircle size={15} weight="fill" />
                              Where It Breaks (Belief Simulation)
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                            <div className="bg-bg-elevated p-3 rounded-lg border border-zinc-800 space-y-1">
                              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                                1. Implied Belief
                              </span>
                              <p className="text-zinc-200 leading-snug">
                                {assessmentResult.belief_simulation.implied_belief}
                              </p>
                            </div>

                            <div className="bg-bg-elevated p-3 rounded-lg border border-zinc-800 space-y-1">
                              <span className="text-[10px] font-mono text-orange-400 uppercase tracking-wider block">
                                2. Consequence
                              </span>
                              <p className="text-zinc-200 leading-snug">
                                {assessmentResult.belief_simulation.consequence}
                              </p>
                            </div>

                            <div className="bg-bg-elevated p-3 rounded-lg border border-red-500/40 space-y-1 bg-red-500/10">
                              <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider block font-bold">
                                3. Why It Breaks
                              </span>
                              <p className="text-zinc-100 leading-snug font-medium">
                                {assessmentResult.belief_simulation.why_it_breaks}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Post-Check Actions */}
                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAssessmentResult(null);
                            setSelectedOption(null);
                            setConfidence(null);
                          }}
                          className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-bg-elevated transition-colors"
                        >
                          <ArrowsClockwise size={14} />
                          <span>Retry Self-Check</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleNextTopic}
                          className="px-5 py-2 bg-lime-300 hover:bg-lime-400 text-black text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <span>Advance to Next Topic</span>
                          <ArrowRight size={13} weight="bold" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Column: Grounded Citations & Lecture Excerpts Rail */}
        <div className="space-y-4">
          <div className="card p-5 space-y-3 sticky top-20 border-bg-border bg-bg-surface">
            <div className="flex items-center justify-between border-b border-bg-border pb-3">
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Quotes size={16} className="text-lime-400" weight="fill" />
                <span>Source Evidence</span>
              </h4>
              <span className="text-[10px] font-mono text-zinc-500">
                Course Grounding
              </span>
            </div>

            {(() => {
              const citations: Citation[] = (studyGuide?.diagnostic_check.citations || []) as Citation[];

              if (citations.length === 0) {
                return (
                  <div className="py-8 text-center text-xs text-zinc-500 space-y-2">
                    <BookOpen size={24} className="mx-auto opacity-50 text-zinc-400" />
                    <p>Verified excerpts will be cited as you explore course materials.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {citations.map((cit, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-bg-elevated/70 border border-zinc-800 rounded-xl space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-lime-400">
                        <span className="truncate max-w-[170px]">
                          {cit.source_filename || "Lecture Notes"}
                        </span>
                        {cit.page && <span>Page {cit.page}</span>}
                      </div>
                      <blockquote className="text-zinc-300 italic pl-2.5 border-l-2 border-lime-400/50 text-[11px] leading-relaxed">
                        &ldquo;{cit.quote}&rdquo;
                      </blockquote>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="pt-2 border-t border-bg-border/60">
              <p className="text-[10px] text-zinc-500 leading-normal">
                Every citation is verified against stored chunks in Postgres. Hallucinated quotes are dropped automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
