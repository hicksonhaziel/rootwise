"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  UsersThree,
  Plus,
  QrCode,
  Copy,
  Check,
  ArrowRight,
  SpinnerGap,
  Sparkle,
  ShareNetwork,
  WarningCircle,
} from "@phosphor-icons/react";

interface RoomSession {
  id: string;
  code: string;
  question_text: string;
  is_active: boolean;
  created_at: string;
}

interface Props {
  courseId: string;
}

export function RoomTab({ courseId }: Props) {
  const [rooms, setRooms] = useState<RoomSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New room form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/courses/${courseId}/rooms`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load rooms");
      setRooms(data.rooms || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading rooms";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!questionText.trim() || creating) return;

    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch(`/api/courses/${courseId}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionText: questionText.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to launch room");

      setRooms((prev) => [data.room, ...prev]);
      setQuestionText("");
      setShowCreateModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating room";
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  }

  function copyParticipantLink(code: string) {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/room/${code}`;
      navigator.clipboard.writeText(url);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  }

  function generateWhatsAppShareUrl(code: string, question: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const text = encodeURIComponent(
      `Join my Rootwise Study Room challenge!\nQuestion: "${question.slice(0, 80)}..."\nAnswer anonymously here: ${origin}/room/${code}`
    );
    return `https://wa.me/?text=${text}`;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="card p-6 border-bg-border bg-gradient-to-b from-bg-surface to-bg-elevated/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-lime-700 dark:text-lime-300 uppercase tracking-wider">
              Judges&apos; Live Room Demo
            </span>
            <span className="text-[10px] font-mono text-text-tertiary bg-bg-base border border-bg-border px-1.5 py-0.5 rounded">
              BUILD.md §3.2
            </span>
          </div>
          <h2 className="text-base font-bold text-text-primary">
            Collaborative Study Rooms & Realtime Analytics
          </h2>
          <p className="text-xs text-text-secondary">
            Broadcast a targeted diagnostic question to a study group or lecture hall. Collect anonymous responses and observe real-time cohort misconception distributions.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 self-start sm:self-center shrink-0"
        >
          <Plus size={15} weight="bold" />
          <span>Launch Study Room</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-status-wrong/10 border border-status-wrong/30 text-xs text-status-wrong flex items-center gap-2">
          <WarningCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Active Rooms List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-text-primary">Active Course Rooms</span>
          <span className="text-text-tertiary font-mono">{rooms.length} created</span>
        </div>

        {loading ? (
          <div className="card p-8 text-center text-xs text-text-tertiary space-y-2">
            <SpinnerGap size={24} className="animate-spin text-lime-400 mx-auto" />
            <p>Loading study rooms…</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="card p-8 text-center text-xs text-text-tertiary space-y-3">
            <UsersThree size={32} className="mx-auto text-text-tertiary" />
            <p>No study rooms launched yet for this course.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Launch your first room</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((room) => {
              const waUrl = generateWhatsAppShareUrl(room.code, room.question_text);
              return (
                <div
                  key={room.id}
                  className="card p-5 border-bg-border bg-bg-surface space-y-4 hover:border-lime-500/30 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-lime-700 dark:text-lime-300 bg-lime-500/10 border border-lime-500/20 px-2 py-0.5 rounded">
                        {room.code}
                      </span>
                      <span className="text-[10px] font-mono text-text-tertiary">
                        {new Date(room.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-text-primary leading-relaxed line-clamp-3">
                      {room.question_text}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-bg-border/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyParticipantLink(room.code)}
                        className="p-1.5 text-text-tertiary hover:text-text-primary rounded border border-bg-border hover:bg-bg-elevated transition-colors"
                        title="Copy participant link"
                      >
                        {copiedCode === room.code ? (
                          <Check size={14} className="text-lime-400" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>

                      {/* WhatsApp Share Card (BUILD.md §3.6) */}
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-text-tertiary hover:text-[#25D366] rounded border border-bg-border hover:bg-bg-elevated transition-colors"
                        title="Share on WhatsApp"
                      >
                        <ShareNetwork size={14} />
                      </a>
                    </div>

                    <Link
                      href={`/room/${room.code}/host`}
                      className="btn-primary px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1.5"
                    >
                      <QrCode size={14} />
                      <span>Host Screen</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-6 max-w-lg w-full space-y-4 border-bg-border bg-bg-surface"
          >
            <div className="flex items-center justify-between border-b border-bg-border pb-3">
              <h3 className="text-sm font-semibold text-text-primary">
                Launch Judges&apos; Study Room
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-text-tertiary hover:text-text-primary text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary">
                  Diagnostic Question for Participants
                </label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter a challenging conceptual question that tests core reasoning..."
                  rows={4}
                  className="input w-full resize-none text-xs leading-relaxed"
                  required
                />
                <p className="text-[10px] text-text-tertiary">
                  Participants will answer and select confidence (Sure / Think so / Guessing) on their phones.
                </p>
              </div>

              {createError && (
                <p className="text-xs text-status-wrong">{createError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!questionText.trim() || creating}
                  className="btn-primary px-4 py-1.5 text-xs font-semibold flex items-center gap-2"
                >
                  {creating ? <SpinnerGap size={14} className="animate-spin" /> : <Sparkle size={14} />}
                  <span>Generate Code & Launch</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
