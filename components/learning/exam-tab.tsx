"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Exam,
  CheckCircle,
  WarningCircle,
  ArrowRight,
  ArrowLeft,
  Sparkle,
  SpinnerGap,
  ArrowClockwise,
  Quotes,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface ExamQuestion {
  id: string;
  question_text: string;
  topic_id: string;
  topic_title: string;
  source_id?: string;
  page_number?: number;
  citation_quote?: string;
  correct_rationale: string;
}

interface StudentResponse {
  questionId: string;
  answer: string;
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
  const [responses, setResponses] = useState<Record<string, StudentResponse>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [currentConfidence, setCurrentConfidence] = useState<"sure" | "think_so" | "guessing" | null>(null);
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
      setCurrentAnswer("");
      setCurrentConfidence(null);
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
    if (q && currentAnswer.trim() && currentConfidence) {
      setResponses((prev) => ({
        ...prev,
        [q.id]: {
          questionId: q.id,
          answer: currentAnswer.trim(),
          confidence: currentConfidence,
        },
      }));
    }

    if (nextIndex >= questions.length) {
      // Submit exam
      setIsExamCompleted(true);
    } else {
      const nextQ = questions[nextIndex];
      const existing = responses[nextQ.id];
      setCurrentIndex(nextIndex);
      setCurrentAnswer(existing ? existing.answer : "");
      setCurrentConfidence(existing ? existing.confidence : null);
    }
  }

  // Welcome state (before exam begins)
  if (questions.length === 0 && !loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="card p-8 border-bg-border bg-gradient-to-b from-bg-surface to-bg-elevated/40 space-y-5">
          <div className="w-12 h-12 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-center text-lime-700 dark:text-lime-300">
            <Exam size={28} />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-text-primary">
              5-Question Mock Exam Practice
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              Experience authentic exam conditions. In this mode, no hints or rationales are revealed until you submit all 5 questions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 bg-bg-base/70 rounded-lg border border-bg-border space-y-1">
              <span className="font-semibold text-text-primary">Grounded Notes</span>
              <p className="text-text-tertiary text-[11px]">Questions strictly derived from your uploaded course notes.</p>
            </div>
            <div className="p-3 bg-bg-base/70 rounded-lg border border-bg-border space-y-1">
              <span className="font-semibold text-text-primary">Confidence Calibrated</span>
              <p className="text-text-tertiary text-[11px]">Identifies dangerous high-confidence misconceptions.</p>
            </div>
            <div className="p-3 bg-bg-base/70 rounded-lg border border-bg-border space-y-1">
              <span className="font-semibold text-text-primary">Fix-First Roadmap</span>
              <p className="text-text-tertiary text-[11px]">Post-exam priority list linking directly to weak topics.</p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-status-wrong/10 border border-status-wrong/30 text-xs text-status-wrong flex items-center gap-2">
              <WarningCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleStartExam}
            className="btn-primary px-6 py-2.5 text-xs font-semibold flex items-center gap-2"
          >
            <Sparkle size={15} />
            <span>Generate & Start 5-Question Exam</span>
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="card p-12 text-center max-w-md mx-auto space-y-3">
        <SpinnerGap size={32} className="animate-spin text-lime-400 mx-auto" />
        <h3 className="text-sm font-semibold text-text-primary">Generating Grounded Exam Set…</h3>
        <p className="text-xs text-text-tertiary">
          Retrieving key concepts and citations from your course materials.
        </p>
      </div>
    );
  }

  // Completed Scorecard View
  if (isExamCompleted) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Exam Completion Banner */}
        <div className="card p-6 border-lime-500/30 bg-gradient-to-b from-bg-surface to-bg-elevated/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-lime-700 dark:text-lime-300 uppercase tracking-wider">
              Exam Complete
            </span>
            <h2 className="text-lg font-bold text-text-primary">
              Performance Breakdown & Citations
            </h2>
            <p className="text-xs text-text-secondary">
              Review your answers alongside official rationales and cited evidence from your lecture notes.
            </p>
          </div>

          <button
            onClick={handleStartExam}
            className="btn-secondary px-4 py-2 text-xs flex items-center gap-2 self-start sm:self-center shrink-0"
          >
            <ArrowClockwise size={15} />
            <span>Retake Another Set</span>
          </button>
        </div>

        {/* Question-by-Question Review */}
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const resp = responses[q.id];
            return (
              <div
                key={q.id}
                className="card p-6 border-bg-border bg-bg-surface space-y-4"
              >
                <div className="flex items-center justify-between border-b border-bg-border/60 pb-3">
                  <span className="text-xs font-semibold text-text-primary">
                    Question {idx + 1} of 5
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-lime-700 dark:text-lime-300 bg-lime-500/10 px-2 py-0.5 rounded border border-lime-500/20">
                      {q.topic_title}
                    </span>
                    {resp && (
                      <span className="text-[10px] font-mono text-text-tertiary bg-bg-base px-2 py-0.5 rounded border border-bg-border">
                        Confidence: {resp.confidence}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm font-medium text-text-primary leading-relaxed">
                  {q.question_text}
                </p>

                {/* Student's Answer */}
                <div className="p-3 bg-bg-base/70 rounded-lg border border-bg-border space-y-1">
                  <span className="text-[10px] font-mono text-text-tertiary uppercase">Your Submitted Response</span>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {resp?.answer || "(No response recorded)"}
                  </p>
                </div>

                {/* Official Rationale */}
                <div className="p-3 bg-lime-500/5 rounded-lg border border-lime-500/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-lime-700 dark:text-lime-300 text-xs font-semibold">
                    <CheckCircle size={15} weight="fill" />
                    <span>Official Course Rationale</span>
                  </div>
                  <p className="text-xs text-text-primary leading-relaxed">
                    {q.correct_rationale}
                  </p>
                </div>

                {/* Note Citation Quote */}
                {q.citation_quote && (
                  <div className="p-3 bg-bg-elevated/40 rounded-lg border border-bg-border space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-text-tertiary font-mono">
                      <span className="flex items-center gap-1 text-text-secondary">
                        <Quotes size={14} className="text-lime-400" />
                        <span>Source Note Evidence</span>
                      </span>
                      {q.page_number && <span>Page {q.page_number}</span>}
                    </div>
                    <blockquote className="italic text-text-secondary text-xs pl-2 border-l border-lime-500/40">
                      &quot;{q.citation_quote}&quot;
                    </blockquote>
                  </div>
                )}

                {/* Fix First Link */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => onNavigateToTopicDiagnostic?.(q.topic_id)}
                    className="text-xs text-lime-700 dark:text-lime-300 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>Diagnose gaps in {q.topic_title}</span>
                    <ArrowRight size={13} />
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
  const canProceed = Boolean(currentAnswer.trim() && currentConfidence);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-text-tertiary">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}% Complete</span>
        </div>
        <div className="w-full h-1.5 bg-bg-surface rounded-full overflow-hidden border border-bg-border">
          <motion.div
            className="h-full bg-lime-400"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Current Question Card */}
      <div className="card p-6 border-bg-border bg-bg-surface space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-lime-700 dark:text-lime-300 uppercase tracking-wider">
            {currentQuestion.topic_title}
          </span>
          <span className="text-[10px] font-mono text-text-tertiary">
            No hints during test
          </span>
        </div>

        <p className="text-base font-medium text-text-primary leading-relaxed">
          {currentQuestion.question_text}
        </p>

        {/* Student Answer */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">
            Your Answer
          </label>
          <textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Write your explanation or calculation step-by-step..."
            rows={5}
            className="input w-full resize-none text-xs leading-relaxed"
          />
        </div>

        {/* Confidence Tap */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">
            Confidence Tap
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: "sure", label: "Sure", desc: "100% certain" },
                { id: "think_so", label: "Think so", desc: "Likely correct" },
                { id: "guessing", label: "Guessing", desc: "Uncertain" },
              ] as const
            ).map((opt) => {
              const isSelected = currentConfidence === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCurrentConfidence(opt.id)}
                  className={cn(
                    "p-2.5 rounded-lg border text-center transition-all",
                    isSelected
                      ? "bg-lime-500/15 border-lime-500/40 text-lime-700 dark:text-lime-300 font-semibold"
                      : "bg-bg-base border-bg-border text-text-secondary hover:border-bg-border/80"
                  )}
                >
                  <p className="text-xs font-medium">{opt.label}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{opt.desc}</p>
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
          className="btn-secondary px-4 py-2 text-xs flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={14} />
          <span>Previous</span>
        </button>

        <button
          onClick={() => handleSaveCurrentAndGo(currentIndex + 1)}
          disabled={!canProceed}
          className={cn(
            "btn-primary px-5 py-2 text-xs font-semibold flex items-center gap-2",
            !canProceed && "opacity-50 cursor-not-allowed"
          )}
        >
          <span>{isLastQuestion ? "Submit & View Results" : "Next Question"}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
