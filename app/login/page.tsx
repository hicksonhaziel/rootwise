"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { RootwiseLogo } from "@/components/ui/rootwise-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ArrowRight, LockKey, EnvelopeSimple, Sparkle, SpinnerGap } from "@phosphor-icons/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      // Auto-create / auto-confirm on backend with zero email verification
      const authRes = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password, action: "seamless" }),
      });

      const authData = await authRes.json();
      if (!authRes.ok) {
        throw new Error(authData.error || "Authentication error");
      }

      // Sign into browser session
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (loginErr) throw loginErr;

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Quick Demo Login for instant testing without email hurdles
  async function handleQuickDemo() {
    setLoading(true);
    setError(null);
    const demoEmail = "student@rootwise.edu";
    const demoPass = "rootwise2026!";

    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: demoEmail,
          password: demoPass,
          action: "signup",
        }),
      });

      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPass,
      });

      if (signErr) throw signErr;

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Demo sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4 relative overflow-hidden font-sans">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Fluid ambient background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.03, 0.07, 0.03],
            x: [0, 20, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-lime-300 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.02, 0.05, 0.02],
            x: [0, -30, 0],
            y: [0, 20, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-lime-300 blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="mb-4 cursor-pointer"
          >
            <RootwiseLogo variant="icon" size={44} />
          </motion.div>

          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Rootwise
          </h1>
          <p className="mt-1 text-xs text-text-secondary max-w-xs leading-relaxed">
            Every wrong answer has a root. We dig it up.
          </p>
        </div>

        {/* Auth card */}
        <div className="card p-6 shadow-2xl relative">
          {/* Mode switch pills with fluid layout animation */}
          <div className="flex bg-bg-elevated border border-bg-border rounded-lg p-1 mb-5 relative">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setInfoMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md relative z-10 transition-colors ${
                mode === "login" ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {mode === "login" && (
                <motion.div
                  layoutId="authPill"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  className="absolute inset-0 bg-bg-surface border border-bg-border rounded-md shadow-sm"
                />
              )}
              <span className="relative z-10">Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
                setInfoMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md relative z-10 transition-colors ${
                mode === "signup" ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {mode === "signup" && (
                <motion.div
                  layoutId="authPill"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  className="absolute inset-0 bg-bg-surface border border-bg-border rounded-md shadow-sm"
                />
              )}
              <span className="relative z-10">Create Account</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2.5 overflow-hidden"
                >
                  {error}
                </motion.div>
              )}

              {infoMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-lime-300 bg-lime-300/10 border border-lime-300/20 rounded-md px-3 py-2 overflow-hidden flex items-center gap-1.5"
                >
                  <SpinnerGap size={13} className="animate-spin" />
                  {infoMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5"
              >
                <EnvelopeSimple size={13} />
                University Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="student@oauife.edu.ng"
                className="w-full bg-bg-elevated border border-bg-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary outline-none focus:border-lime-300 transition-colors"
              />
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5"
              >
                <LockKey size={13} />
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
                className="w-full bg-bg-elevated border border-bg-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary outline-none focus:border-lime-300 transition-colors"
              />
            </div>

            {/* Submit button with spring interaction */}
            <motion.button
              type="submit"
              disabled={loading || !email.trim() || !password}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-2 bg-lime-300 text-text-inverse text-xs font-bold py-2.5 rounded-lg hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <SpinnerGap size={15} className="animate-spin" />
                  <span>Authenticating…</span>
                </>
              ) : (
                <>
                  <span>{mode === "login" ? "Sign In" : "Get Started"}</span>
                  <ArrowRight size={13} weight="bold" />
                </>
              )}
            </motion.button>
          </form>

          {/* Quick Demo Option */}
          <div className="mt-5 pt-4 border-t border-bg-border/60 text-center">
            <p className="text-[11px] text-text-tertiary mb-2.5">
              Judging or quick testing?
            </p>
            <motion.button
              type="button"
              onClick={handleQuickDemo}
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2 px-3 bg-bg-elevated hover:bg-bg-border text-text-secondary hover:text-text-primary text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-bg-border"
            >
              <Sparkle size={13} weight="fill" className="text-lime-300" />
              <span>Instant Demo Account Sign In</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
