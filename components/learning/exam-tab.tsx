"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Exam,
  CheckCircle,
  XCircle,
  WarningCircle,
  ArrowRight,
  ArrowLeft,
  Sparkle,
  SpinnerGap,
  ArrowClockwise,
  Quotes,
  BookOpen,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface Citation {
  source_id: string;
  source_filename?: string;
  page?: number | null;
  quote: string;
}

interface Option {
  key: "A" | "B" | "C" | "D";
  text: string;
}

interface ExamQuestion {
  id: number | string;
  topic_id: string;
  topic_title: string;
  question: string;
  options: Option[];
  correct_option: "A" | "B" | "C" | "D";
  rationale: string;
  citations: Citation[];
}

interface StudentResponse {
  questionId: number | string;
  selectedOption: "A" | "B" | "C" | "D";
  confidence: "sure" | "think_so" | "guessing";
}

interface Props {
  courseId: string;
  onNavigateToTopicDiagnostic?: (topicId: string) => void;
}

export function ExamTab({ courseId, onNavigateToTopicDiagnostic }: Props) {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exam taking state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string | number, StudentResponse>>({});
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [confidence, setConfidence] = useState<"sure" | "think_so" | "guessing" | null>(null);
  const [isExamCompleted, setIsExamCompleted] = useState(false);

  async function handleStartExam() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/exam`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate exam practice questions");
      }
      setQuestions(data.questions || []);
      setCurrentIndex(0);
      setResponses({});
      setSelectedOption(null);
      setConfidence(null);
      setIsExamCompleted(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error starting exam";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleSaveCurrentAndGo(nextIndex: number) {
    const q = questions[currentIndex];
    if (q && selectedOption && confidence) {
      setResponses((prev) => ({
        ...prev,
        [q.id]: {
          questionId: q.id,
          selectedOption,
          confidence,
        },
      }));
    }

    if (nextIndex >= questions.length) {
      // Completed all questions
      setIsExamCompleted(true);
    } else {
      const nextQ = questions[nextIndex];
      const existing = responses[nextQ.id];
      setCurrentIndex(nextIndex);
      setSelectedOption(existing ? existing.selectedOption : null);
      setConfidence(existing ? existing.confidence : null);
    }
  }

  // Welcome state (before exam begins)
  if (questions.length === 0 && !loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="card p-8 border-bg-border bg-gradient-to-b from-bg-surface to-bg-elevated/40 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-center text-lime-400">
              <Exam size={28} weight="bold" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100">
                5-Question Mock Exam Practice
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Calibrated university exam simulation. Select your answers and confidence without typing essays.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 bg-bg-base/80 rounded-xl border border-bg-border space-y-1">
              <span className="font-semibold text-zinc-200 block">Multiple-Choice (A-D)</span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Tackle realistic conceptual and calculation problems with fast option taps.
              </p>
            </div>
            <div className="p-3.5 bg-bg-base/80 rounded-xl border border-bg-border space-y-1">
              <span className="font-semibold text-zinc-200 block">Confidence Calibration</span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Flags dangerous high-confidence misconceptions before your real exam.
              </p>
            </div>
            <div className="p-3.5 bg-bg-base/80 rounded-xl border border-bg-border space-y-1">
              <span className="font-semibold text-zinc-200 block">Grounded Review</span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Instant post-test performance analysis with exact citations from course notes.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2.5">
              <WarningCircle size={18} weight="fill" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-500">
              Exam mode hides answers until all questions are completed.
            </span>
            <button
              onClick={handleStartExam}
              className="px-6 py-2.5 bg-lime-300 hover:bg-lime-400 text-black text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-lime-950/20 active:scale-[0.98]"
            >
              <Sparkle size={16} weight="fill" />
              <span>Generate & Start Exam</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="card p-12 text-center max-w-md mx-auto space-y-4">
        <SpinnerGap size={36} className="animate-spin text-lime-400 mx-auto" />
        <h3 className="text-base font-semibold text-zinc-100">Generating Grounded Exam Set…</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Retrieving key concepts and generating multiple-choice problems directly from your course materials.
        </p>
      </div>
    );
  }

  // Completed Scorecard View
  if (isExamCompleted) {
    const totalCount = questions.length;
    let correctCount = 0;
    let confidentErrorsCount = 0;

    questions.forEach((q) => {
      const resp = responses[q.id];
      if (resp) {
        if (resp.selectedOption === q.correct_option) {
          correctCount++;
        } else if (resp.confidence === "sure") {
          confidentErrorsCount++;
        }
      }
    });

    const scorePercentage = Math.round((correctCount / totalCount) * 100);

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Score Banner */}
        <div className="card p-6 border-lime-500/30 bg-gradient-to-b from-bg-surface to-bg-elevated/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-lime-400 uppercase tracking-wider font-semibold">
              Exam Scorecard
            </span>
            <div className="flex items-baseline gap-3">
              <h2 className="text-2xl font-black text-zinc-100">
                {correctCount} / {totalCount} Correct ({scorePercentage}%)
              </h2>
              {confidentErrorsCount > 0 && (
                <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  ⚠️ {confidentErrorsCount} Confident Knot{confidentErrorsCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Detailed breakdown of your multiple-choice answers with grounded course rationales.
            </p>
          </div>

          <button
            onClick={handleStartExam}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold flex items-center gap-2 self-start sm:self-center shrink-0 transition-colors"
          >
            <ArrowClockwise size={15} />
            <span>Retake Another Set</span>
          </button>
        </div>

        {/* Question-by-Question Review */}
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const resp = responses[q.id];
            const isCorrect = resp?.selectedOption === q.correct_option;
            const isConfidentError = !isCorrect && resp?.confidence === "sure";

            return (
              <div
                key={q.id}
                className={cn(
                  "card p-6 border space-y-4 transition-all",
                  isCorrect
                    ? "border-lime-500/30 bg-bg-surface"
                    : isConfidentError
                    ? "border-red-500/40 bg-red-950/5"
                    : "border-bg-border bg-bg-surface"
                )}
              >
                <div className="flex items-center justify-between border-b border-bg-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-200">
                      Question {idx + 1} of {totalCount}
                    </span>
                    <span className="text-[10px] font-mono text-lime-400 bg-lime-500/10 px-2 py-0.5 rounded border border-lime-500/20">
                      {q.topic_title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {resp && (
                      <span className="text-[10px] font-mono text-zinc-400 bg-bg-base px-2 py-0.5 rounded border border-bg-border">
                        Confidence: {resp.confidence}
                      </span>
                    )}
                    {isCorrect ? (
                      <span className="text-xs font-bold text-lime-400 flex items-center gap-1">
                        <CheckCircle size={16} weight="fill" /> Correct
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                        <XCircle size={16} weight="fill" /> Incorrect
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm font-semibold text-zinc-100 leading-relaxed">
                  {q.question}
                </p>

                {/* Option List with Selection Highlights */}
                <div className="grid grid-cols-1 gap-2 pt-1">
                  {q.options.map((opt) => {
                    const isSelected = resp?.selectedOption === opt.key;
                    const isRightOption = q.correct_option === opt.key;

                    return (
                      <div
                        key={opt.key}
                        className={cn(
                          "p-3 rounded-xl border text-xs flex items-center justify-between transition-all",
                          isRightOption
                            ? "bg-lime-500/10 border-lime-500/50 text-zinc-100 font-medium"
                            : isSelected
                            ? "bg-red-500/10 border-red-500/50 text-zinc-200"
                            : "bg-bg-base/60 border-bg-border/70 text-zinc-400"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "w-6 h-6 rounded-lg font-mono font-bold flex items-center justify-center text-xs shrink-0",
                              isRightOption
                                ? "bg-lime-400 text-black"
                                : isSelected
                                ? "bg-red-500 text-white"
                                : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                            )}
                          >
                            {opt.key}
                          </span>
                          <span className="leading-snug">{opt.text}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isRightOption && (
                            <span className="text-[10px] font-mono text-lime-400 uppercase font-bold">
                              Correct Key
                            </span>
                          )}
                          {isSelected && !isRightOption && (
                            <span className="text-[10px] font-mono text-red-400 uppercase">
                              Your Choice
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Confident Knot Alert */}
                {isConfidentError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2.5">
                    <WarningCircle size={18} className="shrink-0 mt-0.5" weight="fill" />
                    <div>
                      <span className="font-bold uppercase tracking-wider text-[10px] block">
                        High Confidence Misconception Knot
                      </span>
                      <p className="text-[11px] text-red-300/90 mt-0.5 leading-relaxed">
                        You were confident in this answer, but it is an exam distractor trap. We strongly recommend unlearning this knot before your test.
                      </p>
                    </div>
                  </div>
                )}

                {/* Official Rationale */}
                <div className="p-3.5 bg-lime-500/5 rounded-xl border border-lime-500/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-lime-400 text-xs font-bold uppercase tracking-wider">
                    <CheckCircle size={15} weight="fill" />
                    <span>Official Course Rationale</span>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                    {q.rationale}
                  </p>
                </div>

                {/* Note Citations */}
                {q.citations && q.citations.length > 0 && (
                  <div className="p-3 bg-bg-elevated/50 rounded-xl border border-bg-border space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                      <span className="flex items-center gap-1.5 text-zinc-300">
                        <Quotes size={14} className="text-lime-400" />
                        <span>Source Lecture Evidence</span>
                      </span>
                      {q.citations[0].page && <span>Page {q.citations[0].page}</span>}
                    </div>
                    <blockquote className="italic text-zinc-300 text-xs pl-2.5 border-l-2 border-lime-400/50 leading-relaxed">
                      &ldquo;{q.citations[0].quote}&rdquo;
                    </blockquote>
                  </div>
                )}

                {/* Masterclass CTA */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => onNavigateToTopicDiagnostic?.(q.topic_id)}
                    className="text-xs text-lime-400 hover:text-lime-300 hover:underline flex items-center gap-1.5 font-semibold"
                  >
                    <BookOpen size={14} />
                    <span>Open Masterclass for {q.topic_title}</span>
                    <ArrowRight size={13} weight="bold" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Active Exam Taking Mode
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const canProceed = Boolean(selectedOption && confidence);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
          <span className="text-zinc-300 font-semibold">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}% Complete</span>
        </div>
        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
          <motion.div
            className="h-full bg-lime-400 shadow-[0_0_10px_rgba(168,242,92,0.4)]"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.25 }}
          />
        </div>
      </div>

      {/* Current Question Card */}
      <div className="card p-6 border-bg-border bg-bg-surface space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-lime-400 bg-lime-500/10 border border-lime-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
            {currentQuestion.topic_title}
          </span>
          <span className="text-[11px] font-mono text-zinc-500">
            Exam Simulation Mode
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-zinc-100 leading-snug">
          {currentQuestion.question}
        </h3>

        {/* 4 Interactive Option Cards (A, B, C, D) */}
        <div className="space-y-2.5 pt-1">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Select Your Answer
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {currentQuestion.options.map((opt) => {
              const isSelected = selectedOption === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSelectedOption(opt.key)}
                  className={cn(
                    "p-3.5 rounded-xl border text-left flex items-start gap-3.5 transition-all text-xs leading-relaxed",
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
        </div>

        {/* Confidence Tap */}
        <div className="space-y-2 pt-2 border-t border-bg-border/60">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              How confident are you? *
            </label>
            <span className="text-[11px] font-mono text-zinc-500">Calibrates scoring</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {(
              [
                { id: "sure", label: "Sure", desc: "100% certain", icon: "✓" },
                { id: "think_so", label: "Think so", desc: "Reasonably sure", icon: "?" },
                { id: "guessing", label: "Guessing", desc: "Uncertain intuition", icon: "🎲" },
              ] as const
            ).map((opt) => {
              const isSelected = confidence === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setConfidence(opt.id)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all",
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
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => handleSaveCurrentAndGo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Previous</span>
        </button>

        <button
          onClick={() => handleSaveCurrentAndGo(currentIndex + 1)}
          disabled={!canProceed}
          className={cn(
            "px-6 py-2.5 bg-lime-300 hover:bg-lime-400 text-black text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-[0.98]",
            !canProceed && "opacity-40 cursor-not-allowed hover:bg-lime-300"
          )}
        >
          <span>{isLastQuestion ? "Submit & View Scorecard" : "Next Question"}</span>
          <ArrowRight size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
}
