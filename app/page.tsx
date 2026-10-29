import Link from "next/link";
import Image from "next/image";
import {
  Brain,
  TreeStructure,
  Exam,
  UsersThree,
  Sparkle,
  ArrowRight,
  Quotes,
  CheckCircle,
  Lightbulb,
  GithubLogo,
} from "@phosphor-icons/react/dist/ssr";
import { RootwiseLogo } from "@/components/ui/rootwise-logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 selection:bg-lime-300 selection:text-black">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 h-16 border-b border-zinc-800/80 bg-[#0A0A0A]/85 backdrop-blur-md px-6 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <RootwiseLogo size={32} />
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-white">
              Rootwise
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-300 font-semibold">
              OPEN//BUILD 2026
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-4 text-xs font-semibold">
          <a
            href="https://github.com/hicksonhaziel/rootwise"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <GithubLogo size={16} />
            <span>GitHub</span>
          </a>
          <Link
            href="/login"
            className="text-zinc-300 hover:text-white transition-colors px-3 py-1.5"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-lime-300 hover:bg-lime-400 text-black font-bold rounded-lg transition-all shadow-md active:scale-95 flex items-center gap-1.5"
          >
            <span>Enter App</span>
            <ArrowRight size={13} weight="bold" />
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 max-w-6xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
          <span>OSCA Ile-Ife Hacktoberfest Challenge · Open-Weight AI Track</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] text-white max-w-4xl mx-auto">
          Every wrong answer has a root.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-lime-400 to-emerald-400">
            Rootwise digs it up.
          </span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          An open-source misconception finder for university courses. Grounded strictly in your professor&apos;s lecture notes, verified by exact citations, with zero canned responses.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-7 py-3.5 bg-lime-300 hover:bg-lime-400 text-black text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-lime-950/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkle size={18} weight="fill" />
            <span>Launch Interactive Workspace</span>
            <ArrowRight size={15} weight="bold" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <span>Explore Demo Course</span>
          </Link>
        </div>

        {/* Hero Visual Mockup */}
        <div className="pt-8 relative max-w-5xl mx-auto">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-2 shadow-2xl overflow-hidden backdrop-blur-sm group">
            <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-zinc-900">
              <Image
                src="/landing-hero.jpg"
                alt="Rootwise System Architecture & Feature Map"
                fill
                priority
                className="object-cover"
              />
            </div>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-3">
            Realtime knowledge tree, grounded citation verification, and wrong-belief simulation dominoes.
          </p>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-20 border-t border-zinc-900 bg-zinc-950/40 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-lime-400 font-semibold">
              The Pedagogical Engine
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Built for How University Students Actually Learn
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-zinc-800 bg-[#111111]/80 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-400">
                <Lightbulb size={22} weight="bold" />
              </div>
              <h3 className="text-base font-bold text-white">
                Topic Masterclass & Study Guide
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Full-page intuitive breakdowns with plain-English mental models, golden formulas, university exam traps, and zero essay typing.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-zinc-800 bg-[#111111]/80 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-400">
                <Brain size={22} weight="bold" />
              </div>
              <h3 className="text-base font-bold text-white">
                Wrong-Belief Simulator
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Our signature WOW moment: Watch the domino breakdown of a misconception (*Implied Belief → Consequence → Why It Breaks*).
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-zinc-800 bg-[#111111]/80 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-400">
                <TreeStructure size={22} weight="bold" />
              </div>
              <h3 className="text-base font-bold text-white">
                3D Living Knowledge Tree
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Three.js interactive visualization where syllabus topics sprout above ground, and prerequisite foundations extend as animated roots.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl border border-zinc-800 bg-[#111111]/80 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-400">
                <Quotes size={22} weight="bold" />
              </div>
              <h3 className="text-base font-bold text-white">
                Strict Citation Verification
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Every claim is verified against chunks in Postgres. Hallucinated quotes are dropped automatically before rendering.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl border border-zinc-800 bg-[#111111]/80 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-400">
                <UsersThree size={22} weight="bold" />
              </div>
              <h3 className="text-base font-bold text-white">
                Judges&apos; Anonymous Room
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Live classroom diagnostic polling with Supabase Realtime and differential $k \ge 3$ anonymity to eliminate student social fear.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl border border-zinc-800 bg-[#111111]/80 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-400">
                <Exam size={22} weight="bold" />
              </div>
              <h3 className="text-base font-bold text-white">
                Calibrated Exam Practice
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                5-question multiple choice simulation calibrating confidence (*Sure / Think so / Guessing*) to unearth hidden misconception knots.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Open-Source & Model Section */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-zinc-900">
        <div className="card p-8 border-zinc-800 bg-[#111111] space-y-5 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-lime-400 font-bold">
                Open-Weight Model Track
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Powered by openai/gpt-oss-120b & Groq LPUs
              </h3>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 self-center sm:self-auto">
              Apache 2.0 Permissive License
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Rootwise operates entirely on open-weight models. Evaluated across a 16-case benchmark with 100% schema adherence, sub-second Groq inference, and full native support for Nigerian Pidgin and multilingual code-switching.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 justify-center sm:justify-start text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1 rounded border border-zinc-800">
              <CheckCircle size={14} className="text-lime-400" weight="fill" />
              <span>100% Zod Validated</span>
            </span>
            <span className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1 rounded border border-zinc-800">
              <CheckCircle size={14} className="text-lime-400" weight="fill" />
              <span>35 Automated Vitest Tests</span>
            </span>
            <span className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1 rounded border border-zinc-800">
              <CheckCircle size={14} className="text-lime-400" weight="fill" />
              <span>Next.js 15 App Router</span>
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-10 px-6 text-center text-xs text-zinc-500 space-y-3">
        <div className="flex items-center justify-center gap-2 font-semibold text-zinc-300">
          <RootwiseLogo size={20} />
          <span>Rootwise</span>
        </div>
        <p>
          Submitted for OPEN//BUILD 2026 — OSCA Ile-Ife Hacktoberfest Challenge.
        </p>
        <p className="text-[11px] text-zinc-600">
          Released under the MIT License · Built with care for university students.
        </p>
      </footer>
    </div>
  );
}
