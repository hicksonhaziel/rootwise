"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { RootwiseLogo } from "@/components/ui/rootwise-logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // After signup, attempt login
        const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
        if (loginErr) throw loginErr;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <RootwiseLogo size={48} className="mb-4" />
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            {mode === "login"
              ? "Sign in to continue your learning."
              : "Start finding the root of your mistakes."}
          </p>
        </div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="card p-6 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium text-text-secondary uppercase tracking-wide"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full bg-bg-elevated border border-bg-border rounded-md px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-lime-300/40 focus:ring-1 focus:ring-lime-300/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium text-text-secondary uppercase tracking-wide"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full bg-bg-elevated border border-bg-border rounded-md px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-lime-300/40 focus:ring-1 focus:ring-lime-300/20 transition-all"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-lime-300 text-text-inverse font-semibold text-sm py-2.5 rounded-md mt-2 hover:bg-lime-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading
              ? "Loading…"
              : mode === "login"
              ? "Sign in"
              : "Create account"}
          </motion.button>
        </motion.form>

        {/* Mode toggle */}
        <motion.p
          className="text-center text-sm text-text-secondary mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => { setMode("signup"); setError(null); }}
                className="text-lime-300 hover:text-lime-400 font-medium transition-colors"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => { setMode("login"); setError(null); }}
                className="text-lime-300 hover:text-lime-400 font-medium transition-colors"
              >
                Sign in
              </button>
            </>
          )}
        </motion.p>
      </motion.div>

      {/* Tagline */}
      <motion.p
        className="mt-12 text-xs text-text-tertiary text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Every wrong answer has a root.
      </motion.p>
    </div>
  );
}
