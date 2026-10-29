"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Sparkle,
  CheckCircle,
  WarningCircle,
  SpinnerGap,
  ArrowRight,
  User,
  Target,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface Topic {
  id: string;
  title: string;
}

interface FixTundeSession {
  id: string;
  topic_id: string;
  explanation_with_misconception: string;
}

interface GradeResult {
  verdict: "correct" | "partial" | "missed";
  feedback: string;
  revealed_planted_misconception?: string;
  correct_principle?: string;
}

interface Props {
  courseId: string;
}

export function FixTundeTab({ courseId }: Props) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [session, setSession] = useState<FixTundeSession | null>(null);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Student fix submission
  const [studentFix, setStudentFix] = useState("");
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);

  // Load available topics
  useEffect(() => {
    async function loadTopics() {
      try {
        const res = await fetch(`/api/courses/${courseId}/topics`);
        const data = await res.json();
        const loadedTopics: Topic[] = data.topics || [];
        setTopics(loadedTopics);
        if (loadedTopics.length > 0) {
          setSelectedTopicId(loadedTopics[0].id);
        }
      } catch (err) {
        console.error("Failed to load topics for Fix Tunde", err);
      }
    }
    loadTopics();
  }, [courseId]);

  const handleFetchChallenge = useCallback(
    async (topicId?: string) => {
      setLoading(true);
      setError(null);
      setResult(null);
      setStudentFix("");

      const tId = topicId || selectedTopicId;
      try {
        const url = `/api/courses/${courseId}/fix-tunde${tId ? `?topicId=${tId}` : ""}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load Fix Tunde challenge");
        }
        setSession(data.session);
        setActiveTopic(data.topic);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error generating challenge";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [courseId, selectedTopicId]
  );

  async function handleSubmitFix(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !studentFix.trim() || grading) return;

    setGrading(true);
    setError(null);

    try {
      const res = await fetch(`/api/courses/${courseId}/fix-tunde`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          studentFix: studentFix.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to grade fix");
      }

      setResult(data.assessment);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error evaluating fix";
      setError(msg);
    } finally {
      setGrading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="card p-6 border-bg-border bg-gradient-to-b from-bg-surface to-bg-elevated/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-lime-700 dark:text-lime-300 uppercase tracking-wider">
              Peer Misconception Challenge
            </span>
            <span className="text-[10px] font-mono text-text-tertiary bg-bg-base border border-bg-border px-1.5 py-0.5 rounded">
              BUILD.md §3.4
            </span>
          </div>
          <h2 className="text-base font-bold text-text-primary">
            Fix Tunde&apos;s Thinking
          </h2>
          <p className="text-xs text-text-secondary">
            Your classmate Tunde wrote an explanation that sounds convincing, but contains exactly one subtle planted misconception. Spot it and correct him.
          </p>
        </div>

        {/* Topic Selector & Generate */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {topics.length > 0 && (
            <select
              value={selectedTopicId}
              onChange={(e) => {
                setSelectedTopicId(e.target.value);
                handleFetchChallenge(e.target.value);
              }}
              className="input text-xs py-1.5 px-2 bg-bg-base"
              disabled={loading}
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => handleFetchChallenge()}
            disabled={loading}
            className="btn-primary px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shrink-0"
          >
            {loading ? <SpinnerGap size={14} className="animate-spin" /> : <Sparkle size={14} />}
            <span>New Challenge</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-status-wrong/10 border border-status-wrong/30 text-xs text-status-wrong flex items-center gap-2">
          <WarningCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Challenge Arena */}
      {session && activeTopic && (
        <div className="space-y-5">
          {/* Tunde's Explanation Card */}
          <div className="card p-6 border-bg-border bg-bg-surface space-y-3">
            <div className="flex items-center justify-between border-b border-bg-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <User size={15} weight="bold" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary">Tunde&apos;s Explanation</p>
                  <p className="text-[10px] font-mono text-text-tertiary">Topic: {activeTopic.title}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
                1 Planted Error Hidden
              </span>
            </div>

            <div className="p-4 rounded-lg bg-bg-base/80 border border-bg-border text-xs leading-relaxed text-text-primary font-serif">
              {session.explanation_with_misconception}
            </div>
          </div>

          {/* Student's Fix Box (Only show if not yet graded) */}
          {!result && (
            <form onSubmit={handleSubmitFix} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-primary flex items-center justify-between">
                  <span>How would you fix Tunde&apos;s explanation?</span>
                  <span className="text-[10px] text-text-tertiary">Point out where he went wrong and state the correct rule</span>
                </label>
                <textarea
                  value={studentFix}
                  onChange={(e) => setStudentFix(e.target.value)}
                  placeholder="e.g., Tunde mistakenly assumes that..., but according to the course notes, the actual rule is..."
                  rows={4}
                  className="input w-full resize-none text-xs leading-relaxed"
                  disabled={grading}
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!studentFix.trim() || grading}
                  className={cn(
                    "btn-primary px-5 py-2 text-xs font-semibold flex items-center gap-2",
                    (!studentFix.trim() || grading) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {grading ? (
                    <>
                      <SpinnerGap size={14} className="animate-spin" />
                      <span>Grading against planted plant…</span>
                    </>
                  ) : (
                    <>
                      <Target size={15} weight="bold" />
                      <span>Grade My Correction</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Result Banner & Revelation */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 border-bg-border bg-bg-surface space-y-4"
            >
              <div className="flex items-center justify-between border-b border-bg-border/60 pb-3">
                <div className="flex items-center gap-2">
                  {result.verdict === "correct" && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-lime-700 dark:text-lime-300">
                      <CheckCircle size={18} weight="fill" />
                      Spot on! You caught Tunde&apos;s planted misconception.
                    </span>
                  )}
                  {result.verdict === "partial" && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                      <Brain size={18} weight="fill" />
                      Partially correct — you noticed the weakness but missed key nuance.
                    </span>
                  )}
                  {result.verdict === "missed" && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-status-wrong">
                      <WarningCircle size={18} weight="fill" />
                      Missed the planted error — you fell into Tunde&apos;s trap!
                    </span>
                  )}
                </div>
              </div>

              {/* Evaluator Feedback */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-text-tertiary uppercase">Assessment Feedback</span>
                <p className="text-xs text-text-primary leading-relaxed">
                  {result.feedback}
                </p>
              </div>

              {/* Reveal Planted Misconception */}
              {result.revealed_planted_misconception && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-1 text-xs">
                  <span className="font-semibold text-amber-400">The Planted Misconception:</span>
                  <p className="text-text-secondary leading-relaxed">
                    {result.revealed_planted_misconception}
                  </p>
                </div>
              )}

              {/* Correct Principle */}
              {result.correct_principle && (
                <div className="p-3 bg-lime-500/10 border border-lime-500/20 rounded-lg space-y-1 text-xs">
                  <span className="font-semibold text-lime-700 dark:text-lime-300">Sound Conceptual Rule:</span>
                  <p className="text-text-secondary leading-relaxed">
                    {result.correct_principle}
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => handleFetchChallenge()}
                  className="btn-primary px-4 py-2 text-xs flex items-center gap-1.5 font-semibold"
                >
                  <ArrowRight size={14} />
                  <span>Try Next Challenge</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
