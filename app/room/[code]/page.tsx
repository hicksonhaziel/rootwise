"use client";

import { useEffect, useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RootwiseLogo } from "@/components/ui/rootwise-logo";
import {
  CheckCircle,
  WarningCircle,
  SpinnerGap,
  ShieldCheck,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface RoomData {
  id: string;
  code: string;
  question_text: string;
  is_active: boolean;
  courses?: {
    title: string;
    course_code: string | null;
  } | null;
}

type Confidence = "sure" | "think_so" | "guessing";

export default function RoomParticipantPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [optedIn, setOptedIn] = useState(false);
  const [consentDecided, setConsentDecided] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load session token
  const [sessionToken, setSessionToken] = useState("");

  useEffect(() => {
    let token = localStorage.getItem("rw_session_token");
    if (!token) {
      token = "st_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("rw_session_token", token);
    }
    setSessionToken(token);

    // Check if user already submitted for this room
    const alreadySubmitted = localStorage.getItem(`rw_submitted_${code.toUpperCase()}`);
    if (alreadySubmitted) {
      setSubmitted(true);
    }

    async function loadRoom() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/rooms/${code}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Room not found or no longer active.");
        }
        setRoom(data.room);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error loading room";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    loadRoom();
  }, [code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confidence || !answer.trim() || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/rooms/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          answer: answer.trim(),
          confidence,
          optedIn,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit answer");
      }

      setSubmitted(true);
      localStorage.setItem(`rw_submitted_${code.toUpperCase()}`, "true");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error submitting answer";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6 text-text-primary">
        <SpinnerGap size={28} className="animate-spin text-lime-400 mb-3" />
        <p className="text-xs font-mono text-text-tertiary">Connecting to Room {code.toUpperCase()}…</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6 text-text-primary">
        <div className="card p-6 max-w-sm w-full text-center space-y-3 border-status-wrong/30 bg-status-wrong/5">
          <WarningCircle size={32} className="text-status-wrong mx-auto" />
          <h2 className="text-sm font-semibold text-text-primary">Study Room Unavailable</h2>
          <p className="text-xs text-text-secondary">{error || "This study room does not exist or has expired."}</p>
          <a
            href="/dashboard"
            className="inline-block mt-3 px-4 py-2 text-xs font-medium rounded-md bg-bg-elevated hover:bg-bg-border text-text-primary transition-colors"
          >
            Back to Rootwise
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col">
      {/* Header */}
      <header className="border-b border-bg-border bg-bg-surface/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <RootwiseLogo variant="mark" size={20} />
            <div>
              <p className="text-[10px] font-mono text-text-tertiary uppercase leading-none">Judges&apos; Study Room</p>
              <p className="text-xs font-semibold text-text-primary truncate max-w-[180px]">
                {room.courses?.title || "University Course"}
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-lime-700 dark:text-lime-300 bg-lime-500/10 border border-lime-500/20 px-2 py-0.5 rounded">
            {room.code}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="submitted"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-6 text-center space-y-4 border-lime-500/30 bg-gradient-to-b from-bg-surface to-bg-elevated/40"
            >
              <div className="w-12 h-12 rounded-full bg-lime-500/10 border border-lime-500/30 flex items-center justify-center mx-auto text-lime-700 dark:text-lime-300">
                <CheckCircle size={28} weight="fill" />
              </div>

              <div>
                <h3 className="text-base font-semibold text-text-primary">Response Recorded</h3>
                <p className="text-xs text-text-secondary mt-1">
                  Your reasoning has been submitted anonymously. The host screen will update as more participants join.
                </p>
              </div>

              <div className="p-3 bg-bg-base/80 rounded-md border border-bg-border text-left space-y-1.5 text-[11px] text-text-tertiary">
                <div className="flex items-center gap-1.5 text-lime-700 dark:text-lime-300 font-medium">
                  <ShieldCheck size={14} />
                  <span>Privacy Guaranteed</span>
                </div>
                <p>
                  Rootwise aggregates misconceptions only when at least 3 students answer. No names or raw answers are ever shown.
                </p>
              </div>

              <button
                onClick={() => {
                  localStorage.removeItem(`rw_submitted_${code.toUpperCase()}`);
                  setSubmitted(false);
                }}
                className="text-xs text-text-tertiary hover:text-text-primary underline transition-colors"
              >
                Change or resubmit response
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Question Card */}
              <div className="card p-5 border-bg-border bg-bg-surface space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-lime-700 dark:text-lime-300 uppercase tracking-wider">
                    Question
                  </span>
                  <span className="text-[10px] font-mono text-text-tertiary">1 Question • Untimed</span>
                </div>
                <p className="text-sm font-medium text-text-primary leading-relaxed">
                  {room.question_text}
                </p>
              </div>

              {/* Answer Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary flex items-center justify-between">
                  <span>Your Answer & Reasoning</span>
                  <span className="text-[10px] text-text-tertiary">English or Pidgin welcome</span>
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Explain your thinking step-by-step..."
                  rows={4}
                  maxLength={500}
                  className="input w-full resize-none text-xs leading-relaxed"
                  disabled={submitting}
                  required
                />
              </div>

              {/* Confidence Tap (Sure / Think so / Guessing) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary">
                  How confident are you in this answer?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "sure", label: "Sure", desc: "100% certain" },
                      { id: "think_so", label: "Think so", desc: "Fairly sure" },
                      { id: "guessing", label: "Guessing", desc: "Not sure" },
                    ] as const
                  ).map((opt) => {
                    const isSelected = confidence === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setConfidence(opt.id)}
                        disabled={submitting}
                        className={cn(
                          "p-2.5 rounded-lg border text-center transition-all",
                          isSelected
                            ? "bg-lime-500/15 border-lime-500/40 text-lime-700 dark:text-lime-300 font-semibold shadow-sm"
                            : "bg-bg-surface border-bg-border text-text-secondary hover:border-bg-border/80"
                        )}
                      >
                        <p className="text-xs font-medium">{opt.label}</p>
                        <p className="text-[10px] opacity-70 mt-0.5">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opt-in Privacy Line (BUILD.md §3.2) */}
              <div className="space-y-1.5 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optedIn}
                    onChange={(e) => {
                      setOptedIn(e.target.checked);
                      setConsentDecided(true);
                    }}
                    className="mt-0.5 rounded border-bg-border accent-lime-400"
                  />
                  <span className="text-[11px] text-text-tertiary leading-tight">
                    Include my response in anonymous cohort study aggregation (strictly zero names, emails, or personal identifiers).
                  </span>
                </label>
                {!consentDecided && (
                  <button
                    type="button"
                    onClick={() => {
                      setOptedIn(false);
                      setConsentDecided(true);
                    }}
                    className="text-[10px] text-text-tertiary hover:text-text-secondary underline block pl-6"
                  >
                    Keep my response strictly private (do not include in cohort aggregate)
                  </button>
                )}
              </div>

              {submitError && (
                <p className="text-xs text-status-wrong">{submitError}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!confidence || !answer.trim() || !consentDecided || submitting}
                className={cn(
                  "btn-primary w-full py-3 flex items-center justify-center gap-2 text-xs font-semibold shadow-lg transition-all",
                  (!confidence || !answer.trim() || !consentDecided) && "opacity-50 cursor-not-allowed"
                )}
              >
                {submitting ? (
                  <>
                    <SpinnerGap size={16} className="animate-spin" />
                    <span>Analyzing & Submitting…</span>
                  </>
                ) : (
                  <>
                    <PaperPlaneTilt size={16} weight="bold" />
                    <span>Submit Answer</span>
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[10px] text-text-tertiary border-t border-bg-border/40 font-mono">
        Rootwise • OPEN//BUILD 2026 Hackathon
      </footer>
    </div>
  );
}
