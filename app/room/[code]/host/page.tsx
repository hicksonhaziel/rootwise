"use client";

import { useEffect, useState, use, useCallback } from "react";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { RootwiseLogo } from "@/components/ui/rootwise-logo";
import {
  UsersThree,
  QrCode,
  Copy,
  Check,
  WarningCircle,
  ShieldCheck,
  SpinnerGap,
  Sparkle,
  ArrowClockwise,
  ArrowLeft,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface RoomData {
  id: string;
  code: string;
  question_text: string;
  is_active: boolean;
  created_at: string;
}

interface CohortSummary {
  meets_threshold: boolean;
  threshold: number;
  total_responses: number;
  confident_wrong_total: number;
  misconceptions: {
    category: string;
    count: number;
    percentage: number;
  }[];
}

const CATEGORY_LABELS: Record<string, string> = {
  conceptual_misconception: "Conceptual Misconception",
  missing_prerequisite: "Missing Prerequisite Foundation",
  procedural_gap: "Procedural Gap",
  calculation_or_execution_error: "Calculation / Execution Slip",
  partially_correct: "Partially Correct Reasoning",
  appears_correct: "Demonstrated Correct Understanding",
  insufficient_evidence: "Insufficient Evidence to Diagnose",
};

export default function RoomHostPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [cohort, setCohort] = useState<CohortSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/room/${code.toUpperCase()}` : "";

  // Generate branded QR Code
  useEffect(() => {
    if (!joinUrl) return;
    QRCode.toDataURL(joinUrl, {
      margin: 1,
      width: 320,
      color: {
        dark: "#0A0A0A",
        light: "#A8F25C",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Code Error:", err));
  }, [joinUrl]);

  const fetchRoomAnswers = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${code}/answers`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load room analytics");
      }
      setRoom(data.room);
      setCohort(data.cohort);
      setLastRefreshed(new Date());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error fetching answers";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchRoomAnswers();

    // Supabase Realtime channel for live updates
    const supabase = createClient();
    const channel = supabase
      .channel(`room_answers_${code.toUpperCase()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_answers",
          ...(room?.id ? { filter: `room_id=eq.${room.id}` } : {}),
        },
        () => {
          fetchRoomAnswers();
        }
      )
      .subscribe();

    // Polling fallback every 10 seconds
    const interval = setInterval(() => {
      fetchRoomAnswers();
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [code, fetchRoomAnswers, room?.id]);

  function copyJoinLink() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6 text-text-primary">
        <SpinnerGap size={28} className="animate-spin text-lime-400 mb-3" />
        <p className="text-xs font-mono text-text-tertiary">Launching Judges&apos; Host Room…</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6 text-text-primary">
        <div className="card p-6 max-w-sm w-full text-center space-y-3 border-status-wrong/30 bg-status-wrong/5">
          <WarningCircle size={32} className="text-status-wrong mx-auto" />
          <h2 className="text-sm font-semibold text-text-primary">Host Screen Error</h2>
          <p className="text-xs text-text-secondary">{error || "Unable to access host analytics."}</p>
          <Link
            href="/dashboard"
            className="inline-block mt-3 px-4 py-2 text-xs font-medium rounded-md bg-bg-elevated hover:bg-bg-border text-text-primary transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const meetsThreshold = cohort?.meets_threshold ?? false;
  const totalResponses = cohort?.total_responses ?? 0;
  const confidentWrongTotal = cohort?.confident_wrong_total ?? 0;

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-bg-border bg-bg-surface/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-1.5 text-text-tertiary hover:text-text-primary rounded-md transition-colors"
              title="Dashboard"
            >
              <ArrowLeft size={16} weight="bold" />
            </Link>
            <RootwiseLogo variant="mark" size={22} />
            <div>
              <span className="text-xs font-semibold text-text-primary">
                Judges&apos; Live Room Host
              </span>
              <span className="ml-2 text-[10px] font-mono text-lime-700 dark:text-lime-300 bg-lime-500/10 border border-lime-500/20 px-1.5 py-0.5 rounded">
                Realtime Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchRoomAnswers()}
              className="p-1.5 text-text-tertiary hover:text-text-primary rounded-md transition-colors text-xs flex items-center gap-1.5"
              title="Refresh manually"
            >
              <ArrowClockwise size={14} />
              <span className="text-[11px] font-mono hidden sm:inline">
                Synced {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              <QrCode size={15} />
              <span>Show QR</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Host Screen Grid */}
      <main className="max-w-6xl w-full mx-auto p-4 sm:p-6 flex-1 space-y-6">
        {/* Banner with Room Code & Question */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-6 border-bg-border bg-bg-surface space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-lime-700 dark:text-lime-300 uppercase tracking-wider">
                Live Room Challenge
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-text-primary bg-bg-base border border-bg-border px-2.5 py-1 rounded">
                  {room.code}
                </span>
                <button
                  onClick={copyJoinLink}
                  className="p-1.5 text-text-tertiary hover:text-text-primary rounded border border-bg-border hover:bg-bg-elevated transition-colors"
                  title="Copy join link"
                >
                  {copied ? <Check size={14} className="text-lime-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <p className="text-base font-medium text-text-primary leading-relaxed">
              {room.question_text}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-text-tertiary">
              <span className="flex items-center gap-1.5">
                <UsersThree size={16} className="text-lime-400" />
                <strong className="text-text-primary">{totalResponses}</strong> participants answered
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                Link: <span className="text-lime-700 dark:text-lime-300 underline">{joinUrl}</span>
              </span>
            </div>
          </div>

          {/* Quick QR Card */}
          <div className="card p-6 border-bg-border bg-bg-surface flex flex-col items-center justify-center text-center space-y-3">
            {qrDataUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={qrDataUrl}
                alt={`QR code to join room ${room.code}`}
                className="w-40 h-40 rounded-lg p-1 bg-lime-300 shadow-md"
              />
            ) : (
              <div className="w-40 h-40 rounded-lg bg-bg-elevated animate-pulse" />
            )}
            <p className="text-xs text-text-secondary">Scan with any phone camera to join</p>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Sparkle size={16} className="text-lime-400" />
              <span>Live Cohort Misconception Analytics</span>
            </h3>
            <span className="text-[11px] font-mono text-text-tertiary">
              Privacy Threshold: ≥ 3 participants
            </span>
          </div>

          {!meetsThreshold ? (
            /* Privacy Safeguard Banner (BUILD.md §3.2) */
            <div className="card p-8 border-bg-border bg-bg-surface text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-lime-500/10 border border-lime-500/30 flex items-center justify-center mx-auto text-lime-700 dark:text-lime-300">
                <ShieldCheck size={28} />
              </div>
              <h4 className="text-sm font-semibold text-text-primary">
                Privacy Safeguard Active
              </h4>
              <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
                Waiting for at least <strong>3 participants</strong> to ensure zero individual answers or identities can be deduced.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-base border border-bg-border text-xs font-mono text-text-tertiary">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>{totalResponses} / 3 responses recorded</span>
              </div>
            </div>
          ) : (
            /* Aggregated Analytics Dashboard */
            <div className="space-y-4">
              {/* Confident Wrong Metric Callout */}
              {confidentWrongTotal > 0 && (
                <div className="p-4 rounded-lg border border-status-wrong/30 bg-status-wrong/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <WarningCircle size={20} className="text-status-wrong shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-status-wrong">
                        High Priority: Confident-Wrong Cluster Detected
                      </p>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        {confidentWrongTotal} participant{confidentWrongTotal > 1 ? "s" : ""} selected &quot;Sure&quot; on an incorrect answer. This marks a deep conceptual knot.
                      </p>
                    </div>
                  </div>
                  <span className="text-base font-mono font-bold text-status-wrong px-3 py-1 rounded bg-status-wrong/20">
                    {confidentWrongTotal}
                  </span>
                </div>
              )}

              {/* Misconception Distribution Bars */}
              <div className="card p-6 border-bg-border bg-bg-surface space-y-4">
                <div className="flex items-center justify-between border-b border-bg-border/60 pb-3">
                  <span className="text-xs font-semibold text-text-primary">
                    Misconception Category Breakdown
                  </span>
                  <span className="text-[11px] font-mono text-text-tertiary">
                    {cohort?.misconceptions.length ?? 0} Categories Identified
                  </span>
                </div>

                <div className="space-y-3">
                  {cohort?.misconceptions.map((item) => {
                    const label = CATEGORY_LABELS[item.category] || item.category;
                    const isCorrect = item.category === "appears_correct";
                    return (
                      <div key={item.category} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className={cn("font-medium", isCorrect ? "text-lime-700 dark:text-lime-300" : "text-text-primary")}>
                            {label}
                          </span>
                          <span className="font-mono text-text-secondary text-[11px]">
                            {item.count} student{item.count > 1 ? "s" : ""} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-bg-base overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className={cn(
                              "h-full rounded-full",
                              isCorrect ? "bg-lime-400" : item.category === "conceptual_misconception" ? "bg-status-wrong" : "bg-amber-400"
                            )}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Full-Screen QR Modal */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card p-8 max-w-sm w-full text-center space-y-4 border-bg-border bg-bg-surface relative"
            >
              <button
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary p-1"
              >
                <X size={18} />
              </button>

              <h3 className="text-base font-bold text-text-primary">
                Join Room {room.code}
              </h3>
              <p className="text-xs text-text-secondary">
                Scan with any smartphone camera to submit your answer.
              </p>

              {qrDataUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={qrDataUrl}
                  alt={`QR code for room ${room.code}`}
                  className="w-56 h-56 mx-auto rounded-xl p-2 bg-lime-300 shadow-xl"
                />
              )}

              <p className="text-xs font-mono text-lime-700 dark:text-lime-300 font-semibold break-all">
                {joinUrl}
              </p>

              <button
                onClick={copyJoinLink}
                className="btn-secondary w-full py-2 text-xs flex items-center justify-center gap-1.5"
              >
                {copied ? <Check size={14} className="text-lime-400" /> : <Copy size={14} />}
                <span>{copied ? "Link Copied!" : "Copy Direct Link"}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
