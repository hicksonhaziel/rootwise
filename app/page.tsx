"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Brain,
  TreeStructure,
  Exam,
  UsersThree,
  ArrowRight,
  Quotes,
  CheckCircle,
  Lightbulb,
  GithubLogo,
  WarningCircle,
  Sparkle,
  BookOpen,
} from "@phosphor-icons/react";
import { RootwiseLogo } from "@/components/ui/rootwise-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"standard" | "pidgin">("standard");

  return (
    <div className="min-h-screen bg-bg-base text-text-primary selection:bg-lime-300 selection:text-black transition-colors duration-200">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 h-16 border-b border-bg-border bg-bg-base/85 backdrop-blur-md px-4 sm:px-6">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <RootwiseLogo size={32} />
            </Link>
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-bg-elevated border border-bg-border text-text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse" />
              OPEN//BUILD 2026 · OSCA Ile-Ife
            </span>
          </div>

          <nav className="flex items-center gap-2 sm:gap-3 text-xs font-semibold">
            <a
              href="https://github.com/hicksonhaziel/rootwise"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors px-2 py-1.5"
            >
              <GithubLogo size={16} />
              <span>GitHub</span>
            </a>

            {/* In-app theme toggle (light / system / dark) */}
            <ThemeToggle />

            <Link
              href="/login"
              className="text-text-secondary hover:text-text-primary transition-colors px-2 sm:px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/courses/886d1c53-8799-441e-86cd-ea26f3304c9c"
              className="px-3.5 sm:px-4 py-2 bg-lime-400 dark:bg-lime-300 hover:bg-lime-300 dark:hover:bg-lime-400 text-black font-bold rounded-lg transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
            >
              <span>Demo Course</span>
              <ArrowRight size={13} weight="bold" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-elevated border border-bg-border text-xs font-mono text-text-secondary">
          <span className="text-lime-600 dark:text-lime-400 font-bold">Hacktoberfest Track</span>
          <span>·</span>
          <span>Open-Weight AI Model</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.12] text-text-primary max-w-4xl mx-auto">
          Every wrong answer has a root.{" "}
          <span className="text-lime-600 dark:text-lime-300 underline decoration-lime-500/40 underline-offset-8">
            Rootwise digs it up.
          </span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
          Most university students don&apos;t fail exams because they didn&apos;t read. They fail because of one quiet misunderstanding they were sure was right. Rootwise diagnoses the belief behind your answer and tests the fix against your lecturer&apos;s own notes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/courses/886d1c53-8799-441e-86cd-ea26f3304c9c"
            className="w-full sm:w-auto px-6 py-3.5 bg-lime-400 dark:bg-lime-300 hover:bg-lime-300 dark:hover:bg-lime-400 text-black text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            <Sparkle size={17} weight="fill" />
            <span>Open MTH101 Calculus Workspace</span>
            <ArrowRight size={15} weight="bold" />
          </Link>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-5 py-3.5 bg-bg-surface hover:bg-bg-elevated text-text-primary border border-bg-border rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <span>View All Courses</span>
          </Link>
        </div>

        {/* Live Interactive Misconception Showcase Card */}
        <div className="pt-8 text-left max-w-3xl mx-auto">
          <div className="rounded-2xl border border-bg-border bg-bg-surface shadow-xl overflow-hidden transition-all">
            {/* Window Header */}
            <div className="px-5 py-3.5 border-b border-bg-border bg-bg-elevated flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-lime-500/70" />
                </div>
                <span className="text-xs font-mono text-text-tertiary">
                  MTH101 · Chapter 3: Differentiation
                </span>
              </div>

              {/* Language Switcher for Equity Demonstration */}
              <div className="flex items-center gap-1 bg-bg-base p-1 rounded-lg border border-bg-border text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setActiveTab("standard")}
                  className={`px-2.5 py-0.5 rounded transition-colors ${
                    activeTab === "standard"
                      ? "bg-bg-elevated text-text-primary font-bold shadow-xs"
                      : "text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("pidgin")}
                  className={`px-2.5 py-0.5 rounded transition-colors ${
                    activeTab === "pidgin"
                      ? "bg-bg-elevated text-lime-600 dark:text-lime-300 font-bold shadow-xs"
                      : "text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  Nigerian Pidgin
                </button>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6 space-y-6">
              {/* Question & Student Response */}
              <div className="space-y-3 pb-5 border-b border-bg-border">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-text-tertiary font-bold">
                    Classroom Diagnostic Problem
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-semibold">
                    Confidence: Sure (Confident Error Knot)
                  </span>
                </div>
                <p className="text-base font-semibold text-text-primary">
                  Calculate the derivative: <span className="font-mono bg-bg-elevated px-2 py-0.5 rounded">d/dx [x² · sin(x)]</span>
                </p>

                <div className="p-3.5 rounded-xl bg-bg-elevated border border-bg-border text-xs space-y-1">
                  <span className="font-mono text-text-tertiary block">
                    Student&apos;s Submitted Reasoning:
                  </span>
                  <p className="text-text-primary font-mono text-sm">
                    {activeTab === "standard"
                      ? "(x²)' · (sin x)' = 2x · cos(x)"
                      : "I just differentiate the two sides sharp: (x²)' give 2x, (sin x)' give cos x, so answer na 2x·cos(x)."}
                  </p>
                </div>
              </div>

              {/* Rootwise Diagnostic Pipeline Breakdown */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-lime-500/10 border border-lime-500/30 flex items-center justify-center text-lime-600 dark:text-lime-400">
                    <Sparkle size={12} weight="fill" />
                  </div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-lime-700 dark:text-lime-300 font-bold">
                    The Wrong-Belief Simulator (Signature WOW)
                  </h3>
                </div>

                {/* Domino Sequence */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Step 1 */}
                  <div className="p-3.5 rounded-xl bg-bg-elevated/70 border border-bg-border space-y-1.5">
                    <span className="text-[10px] font-mono text-text-tertiary uppercase block">
                      1. Implied Rule
                    </span>
                    <p className="text-xs text-text-secondary leading-snug">
                      {activeTab === "standard"
                        ? "You assumed differentiation distributes over multiplication: (u·v)' = u'·v'."
                        : "You assume say derivative dey share itself enter multiplication just like normal plus."}
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3.5 rounded-xl bg-bg-elevated/70 border border-bg-border space-y-1.5">
                    <span className="text-[10px] font-mono text-text-tertiary uppercase block">
                      2. If That Were True
                    </span>
                    <p className="text-xs text-text-secondary leading-snug">
                      {activeTab === "standard"
                        ? "Take f(x) = x · x. Your rule gives d/dx[x] · d/dx[x] = 1 · 1 = 1."
                        : "If e be so, make you test x · x: your rule go say (1) · (1) = 1."}
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/20 space-y-1.5">
                    <span className="text-[10px] font-mono text-red-600 dark:text-red-400 uppercase block font-bold">
                      3. Where It Breaks
                    </span>
                    <p className="text-xs text-red-700 dark:text-red-300 leading-snug">
                      {activeTab === "standard"
                        ? "x · x is x², whose true derivative is 2x. 1 ≠ 2x. The assumption collapses on basic algebra."
                        : "But x · x na x², and derivative of x² na 2x! 1 no fit equal 2x, so the rule don fail immediately."}
                    </p>
                  </div>
                </div>

                {/* Verified Grounding */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-bg-elevated p-3 rounded-xl border border-bg-border">
                  <div className="flex items-center gap-2">
                    <Quotes size={16} className="text-lime-600 dark:text-lime-400 flex-shrink-0" weight="fill" />
                    <span className="text-text-secondary italic">
                      &ldquo;Theorem 3.2 (Product Rule): (u·v)&apos; = u&apos;v + uv&apos;. It is never u&apos;v&apos;.&rdquo;
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-text-tertiary whitespace-nowrap self-end sm:self-auto">
                    MTH101 Notes · Slide 14
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-text-tertiary mt-3 font-mono">
            Interactive diagnostic card · Citations verified against PostgreSQL chunks · Zero hallucinations
          </p>
        </div>
      </section>

      {/* Why We Built Rootwise (Human Story) */}
      <section className="py-16 border-t border-bg-border bg-bg-surface/50 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-lime-700 dark:text-lime-400 font-bold">
              The Reality of University Lecture Theatres
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              Why generic chatbots fail university students
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-bg-border bg-bg-surface space-y-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <WarningCircle size={20} weight="bold" />
              </div>
              <h3 className="text-base font-bold text-text-primary">
                The 500-Student Hall & Fear of Shame
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                In packed lecture halls at Ife or any federal university, lecturers teach at high speed. When students get confused, almost no one raises a hand to ask why their line of thought didn&apos;t work—the social fear is too high.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-bg-border bg-bg-surface space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <BookOpen size={20} weight="bold" />
              </div>
              <h3 className="text-base font-bold text-text-primary">
                Unanchored & Hallucinated Explanations
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Generic AI tools don&apos;t know your lecturer&apos;s syllabus. They write long generic essays using notations your professor never taught, confusing you further instead of showing you the exact algebraic slip.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-lime-700 dark:text-lime-400 font-bold">
            Pedagogical Engine
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
            How Rootwise fixes the gaps
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Feature 1 */}
          <div className="p-5 rounded-2xl border border-bg-border bg-bg-surface space-y-3 hover:border-lime-500/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-600 dark:text-lime-400">
              <Lightbulb size={20} weight="bold" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">
              Full-Page Topic Masterclass
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Intuitive mental models, golden rules, and university exam traps condensed straight from uploaded handouts. Zero essay typing needed.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-5 rounded-2xl border border-bg-border bg-bg-surface space-y-3 hover:border-lime-500/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-600 dark:text-lime-400">
              <Brain size={20} weight="bold" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">
              Wrong-Belief Domino Simulator
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Rootwise generates concrete counterexamples that prove where your false assumption collapses, so the correct rule sticks permanently.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-5 rounded-2xl border border-bg-border bg-bg-surface space-y-3 hover:border-lime-500/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-600 dark:text-lime-400">
              <TreeStructure size={20} weight="bold" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">
              3D Living Knowledge Tree
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Three.js visualization where prerequisite foundations anchor underground as living roots, and syllabus topics sprout as leafy branches above.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-5 rounded-2xl border border-bg-border bg-bg-surface space-y-3 hover:border-lime-500/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-600 dark:text-lime-400">
              <Quotes size={20} weight="bold" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">
              Verified Lecture Citations
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Every diagnosis cites the exact chunk from your uploaded PDF notes. If a quote is not found in the course database, it is rejected automatically.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-5 rounded-2xl border border-bg-border bg-bg-surface space-y-3 hover:border-lime-500/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-600 dark:text-lime-400">
              <UsersThree size={20} weight="bold" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">
              Judges&apos; Anonymous Room
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Live classroom diagnostic polling with Supabase Realtime and differential k-anonymity (k &ge; 3). Students answer on mobile without fear of exposure.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-5 rounded-2xl border border-bg-border bg-bg-surface space-y-3 hover:border-lime-500/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-600 dark:text-lime-400">
              <Exam size={20} weight="bold" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">
              Calibrated Exam Practice
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Multiple-choice past questions calibrated with confidence tapping (Sure / Think so / Guessing) to expose hidden &ldquo;confident error knots&rdquo;.
            </p>
          </div>
        </div>
      </section>

      {/* Open-Weight AI Architecture Details */}
      <section className="py-14 border-t border-bg-border bg-bg-surface/40 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-lime-700 dark:text-lime-400 font-bold">
                Open-Weight Model Track
              </span>
              <h3 className="text-lg font-bold text-text-primary mt-0.5">
                openai/gpt-oss-120b on Groq LPUs
              </h3>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded bg-bg-elevated border border-bg-border text-text-secondary self-start sm:self-auto">
              Apache 2.0 Permissive License
            </span>
          </div>

          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            Rootwise is free from commercial vendor lock-in. Evaluated on a 16-case benchmark with 100% schema adherence, sub-second Groq inference, and full native support for Nigerian Pidgin and multilingual code-switching.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-text-secondary">
            <span className="flex items-center gap-1.5 bg-bg-elevated px-3 py-1.5 rounded-lg border border-bg-border">
              <CheckCircle size={14} className="text-lime-600 dark:text-lime-400" weight="fill" />
              <span>100% Zod Validated</span>
            </span>
            <span className="flex items-center gap-1.5 bg-bg-elevated px-3 py-1.5 rounded-lg border border-bg-border">
              <CheckCircle size={14} className="text-lime-600 dark:text-lime-400" weight="fill" />
              <span>35 Automated Vitest Tests</span>
            </span>
            <span className="flex items-center gap-1.5 bg-bg-elevated px-3 py-1.5 rounded-lg border border-bg-border">
              <CheckCircle size={14} className="text-lime-600 dark:text-lime-400" weight="fill" />
              <span>Offline Edge Fallback (qwen3:4b)</span>
            </span>
            <span className="flex items-center gap-1.5 bg-bg-elevated px-3 py-1.5 rounded-lg border border-bg-border">
              <CheckCircle size={14} className="text-lime-600 dark:text-lime-400" weight="fill" />
              <span>Differential k &ge; 3 Privacy</span>
            </span>
          </div>
        </div>
      </section>

      {/* Hackathon Footer */}
      <footer className="border-t border-bg-border py-12 px-4 sm:px-6 bg-bg-base text-center text-xs text-text-tertiary space-y-4">
        <div className="flex items-center justify-center gap-2 font-semibold text-text-primary text-sm">
          <RootwiseLogo size={22} />
        </div>
        <p className="max-w-md mx-auto text-text-secondary">
          Built for OPEN//BUILD 2026 — OSCA Ile-Ife Hacktoberfest Challenge.
        </p>
        <div className="flex items-center justify-center gap-4 text-text-secondary text-xs">
          <Link href="/courses/886d1c53-8799-441e-86cd-ea26f3304c9c" className="hover:text-text-primary transition-colors">
            Demo Course
          </Link>
          <span>·</span>
          <a
            href="https://github.com/hicksonhaziel/rootwise"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-primary transition-colors"
          >
            GitHub Repository
          </a>
          <span>·</span>
          <Link href="/dashboard" className="hover:text-text-primary transition-colors">
            Dashboard
          </Link>
        </div>
        <p className="text-[11px] text-text-tertiary pt-2">
          Open-Source under the MIT License · Designed for Nigerian University Students
        </p>
      </footer>
    </div>
  );
}
