"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "@phosphor-icons/react";
import { createClient } from "@/utils/supabase/client";

interface Course {
  id: string;
  title: string;
  course_code: string | null;
  created_at: string;
}

interface Props {
  onClose: () => void;
  onCreated: (course: Course) => void;
}

export function CreateCourseModal({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      setError("Not signed in");
      setLoading(false);
      return;
    }

    const { data, error: dbError } = await supabase
      .from("courses")
      .insert({
        title: title.trim(),
        course_code: code.trim() || null,
        owner_user_id: user.user.id,
      })
      .select("id, title, course_code, created_at")
      .single();

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    // Auto-add owner as a member
    await supabase.from("course_members").insert({
      course_id: data.id,
      user_id: user.user.id,
      role: "owner",
    });

    onCreated(data);
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !loading && onClose()}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
      >
        <div className="bg-bg-surface border border-bg-border rounded-xl shadow-2xl w-full max-w-md p-6 pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-text-primary">
              Create a new course
            </h2>
            <button
              onClick={() => !loading && onClose()}
              disabled={loading}
              className="p-1.5 text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                Course name *
              </label>
              <input
                type="text"
                disabled={loading}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
                placeholder="e.g. Engineering Mathematics"
                className="w-full bg-bg-elevated border border-bg-border rounded-md px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-lime-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                Course code{" "}
                <span className="text-text-tertiary normal-case font-normal">
                  (optional)
                </span>
              </label>
              <input
                type="text"
                disabled={loading}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. MTH101"
                className="w-full bg-bg-elevated border border-bg-border rounded-md px-3 py-2.5 text-sm font-mono text-text-primary placeholder:text-text-tertiary outline-none focus:border-lime-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="flex-1 bg-bg-elevated text-text-secondary text-sm font-medium py-2.5 rounded-md hover:bg-bg-overlay disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={loading || !title.trim()}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-lime-300 text-[#0A0A0A] text-sm font-bold py-2.5 rounded-md hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {loading ? "Creating…" : "Create course"}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
