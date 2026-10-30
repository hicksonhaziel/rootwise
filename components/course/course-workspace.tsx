"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { RootwiseLogo } from "@/components/ui/rootwise-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { MaterialsTab } from "@/components/sources/materials-tab";
import { TopicsTab } from "@/components/course/topics-tab";
import { DiagnosticSession } from "@/components/learning/diagnostic-session";
import { ExamTab } from "@/components/learning/exam-tab";
import { FixTundeTab } from "@/components/learning/fix-tunde-tab";
import { RoomTab } from "@/components/course/room-tab";
import { cachedFetch } from "@/lib/cache";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Brain,
  MapTrifold,
  Exam,
  UsersThree,
  ArrowRight,
  Target,
  ShareNetwork,
  CalendarBlank,
  Sparkle,
  TreeStructure,
} from "@phosphor-icons/react";

interface Course {
  id: string;
  title: string;
  course_code: string | null;
  created_at: string;
}

type Tab = "overview" | "materials" | "topics" | "learn" | "exam" | "tunde" | "room";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "materials", label: "Materials", icon: FileText },
  { id: "topics", label: "Topic Map", icon: MapTrifold },
  { id: "learn", label: "Learn", icon: Brain },
  { id: "exam", label: "Exam Practice", icon: Exam },
  { id: "tunde", label: "Fix Tunde", icon: Target },
  { id: "room", label: "Judges' Room", icon: UsersThree },
];

export function CourseWorkspace({
  course,
  initialTab = "materials",
  initialTopicId = null,
}: {
  course: Course;
  initialTab?: Tab;
  initialTopicId?: string | null;
}) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [visitedTabs, setVisitedTabs] = useState<Set<Tab>>(new Set([initialTab]));
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(initialTopicId);

  const handleSelectTab = (tab: Tab) => {
    setActiveTab(tab);
    setVisitedTabs((prev) => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Top nav */}
      <nav className="border-b border-bg-border bg-bg-base/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link
              href="/dashboard"
              prefetch={true}
              className="p-1.5 text-text-tertiary hover:text-text-primary rounded-md transition-colors inline-flex items-center justify-center shrink-0"
              title="Back to dashboard"
            >
              <ArrowLeft size={16} weight="bold" />
            </Link>
            <RootwiseLogo variant="mark" size={22} />
            <div className="flex items-center gap-2 min-w-0">
              {course.course_code && (
                <span className="text-[11px] font-mono font-medium text-lime-700 dark:text-lime-300 bg-lime-500/10 dark:bg-lime-300/10 border border-lime-500/20 dark:border-lime-300/20 px-2 py-0.5 rounded shrink-0">
                  {course.course_code}
                </span>
              )}
              <span className="text-sm font-medium text-text-primary truncate max-w-[160px] sm:max-w-[300px]">
                {course.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Tab bar */}
      <div className="border-b border-bg-border bg-bg-surface/80 backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 w-full no-scrollbar">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectTab(tab.id)}
                  className={`
                    relative flex items-center gap-2 px-3.5 h-9 text-xs font-medium transition-all whitespace-nowrap rounded-lg shrink-0
                    ${
                      isActive
                        ? "text-lime-700 dark:text-lime-300 font-semibold shadow-sm"
                        : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/60"
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeWorkspaceTab"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      className="absolute inset-0 bg-lime-500/10 dark:bg-lime-300/10 border border-lime-500/30 dark:border-lime-300/30 rounded-lg"
                    />
                  )}
                  <Icon size={16} weight={isActive ? "fill" : "regular"} className="relative z-10 shrink-0" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab content - keep visited tabs mounted to preserve state and avoid refetching */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {visitedTabs.has("overview") && (
          <div className={activeTab === "overview" ? "block" : "hidden"}>
            <OverviewTab
              course={course}
              onNavigate={(tab) => handleSelectTab(tab)}
            />
          </div>
        )}
        {visitedTabs.has("materials") && (
          <div className={activeTab === "materials" ? "block" : "hidden"}>
            <MaterialsTab
              courseId={course.id}
              onNavigateToTopics={() => handleSelectTab("topics")}
            />
          </div>
        )}
        {visitedTabs.has("topics") && (
          <div className={activeTab === "topics" ? "block" : "hidden"}>
            <TopicsTab
              courseId={course.id}
              onSelectTopicForDiagnostic={(topicId) => {
                setSelectedTopicId(topicId);
                handleSelectTab("learn");
              }}
            />
          </div>
        )}
        {visitedTabs.has("learn") && (
          <div className={activeTab === "learn" ? "block" : "hidden"}>
            <DiagnosticSession
              courseId={course.id}
              initialTopicId={selectedTopicId}
              onNavigateToTopics={() => handleSelectTab("topics")}
            />
          </div>
        )}
        {visitedTabs.has("exam") && (
          <div className={activeTab === "exam" ? "block" : "hidden"}>
            <ExamTab
              courseId={course.id}
              onNavigateToTopicDiagnostic={(topicId) => {
                setSelectedTopicId(topicId);
                handleSelectTab("learn");
              }}
            />
          </div>
        )}
        {visitedTabs.has("tunde") && (
          <div className={activeTab === "tunde" ? "block" : "hidden"}>
            <FixTundeTab courseId={course.id} />
          </div>
        )}
        {visitedTabs.has("room") && (
          <div className={activeTab === "room" ? "block" : "hidden"}>
            <RoomTab courseId={course.id} />
          </div>
        )}
      </main>
    </div>
  );
}

function OverviewTab({
  course,
  onNavigate,
}: {
  course: Course;
  onNavigate: (tab: Tab, topicId?: string) => void;
}) {
  const [topics, setTopics] = useState<
    { id: string; title: string; status?: string; confident_error?: boolean }[]
  >([]);
  const [examDate, setExamDate] = useState("2026-11-15");

  useEffect(() => {
    async function loadTopics() {
      try {
        const data = await cachedFetch<{
          topics: { id: string; title: string; status?: string; confident_error?: boolean }[];
        }>(`/api/courses/${course.id}/topics`);
        setTopics(data.topics || []);
      } catch (err) {
        console.error("Failed to load topics for overview", err);
      }
    }
    loadTopics();
  }, [course.id]);

  const daysToExam = Math.max(
    0,
    Math.ceil(
      (new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const waShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `Studying for ${course.course_code || course.title} with Rootwise! Check out the misconception finder here.`
  )}`;

  const totalTopics = topics.length;
  const demonstratedCount = topics.filter((t) => t.status === "demonstrated").length;
  const developingCount = topics.filter((t) => t.status === "developing").length;
  const needsWorkCount = topics.filter((t) => t.status === "needs_work").length;
  const knotsCount = topics.filter((t) => t.confident_error).length;
  const masteryPercentage =
    totalTopics > 0 ? Math.round((demonstratedCount / totalTopics) * 100) : 0;

  // Next recommended topic: knots first, then needs_work, then not_started
  const priorityTopic =
    topics.find((t) => t.confident_error) ||
    topics.find((t) => t.status === "needs_work") ||
    topics.find((t) => !t.status || t.status === "not_started") ||
    topics[0];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Course Banner & Syllabus Mastery Bar */}
      <div className="card p-6 border-bg-border bg-gradient-to-b from-bg-surface to-bg-elevated/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {course.course_code && (
                <span className="text-xs font-mono font-medium text-lime-700 dark:text-lime-300 bg-lime-500/10 dark:bg-lime-300/10 border border-lime-500/20 dark:border-lime-300/20 px-2 py-0.5 rounded">
                  {course.course_code}
                </span>
              )}
              <span className="text-xs text-text-tertiary font-mono">
                Created {new Date(course.created_at).toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-text-primary">{course.title}</h2>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-2xl font-bold font-mono text-lime-700 dark:text-lime-300">
              {masteryPercentage}%
            </p>
            <p className="text-[11px] text-text-tertiary font-mono uppercase tracking-wider">
              Syllabus Demonstrated
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-text-tertiary font-mono">
            <span>Course Readiness</span>
            <span>
              {demonstratedCount} of {totalTopics} Topics Mastered
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-bg-base overflow-hidden border border-bg-border">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${masteryPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-lime-400 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Recommended Next Masterclass Card */}
      {priorityTopic && (
        <div className="card p-5 border-lime-500/30 bg-lime-500/5 dark:bg-lime-300/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-lime-700 dark:text-lime-300 text-xs font-semibold">
              <Sparkle size={15} weight="fill" />
              <span>Recommended Next Masterclass</span>
              {priorityTopic.confident_error && (
                <span className="text-[10px] font-mono text-status-wrong bg-status-wrong/10 border border-status-wrong/20 px-1.5 py-0.2 rounded">
                  Knot to Clear
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-text-primary">
              {priorityTopic.title}
            </h3>
            <p className="text-xs text-text-secondary">
              Deep dive into this concept with formulas, intuition, worked examples, and misconception checks.
            </p>
          </div>

          <button
            onClick={() => onNavigate("learn", priorityTopic.id)}
            className="btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 shrink-0 self-start sm:self-center"
          >
            <span>Study Topic Guide</span>
            <ArrowRight size={14} weight="bold" />
          </button>
        </div>
      )}

      {/* Knowledge Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => onNavigate("topics")}
          className="card p-4 border-bg-border bg-bg-surface hover:border-lime-500/40 cursor-pointer transition-all space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Demonstrated</span>
            <span className="w-2.5 h-2.5 rounded-full bg-lime-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-text-primary">{demonstratedCount}</p>
          <p className="text-[10px] text-text-tertiary">Verified mastery</p>
        </div>

        <div
          onClick={() => onNavigate("topics")}
          className="card p-4 border-bg-border bg-bg-surface hover:border-blue-500/40 cursor-pointer transition-all space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Developing</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-text-primary">{developingCount}</p>
          <p className="text-[10px] text-text-tertiary">Partial understanding</p>
        </div>

        <div
          onClick={() => onNavigate("topics")}
          className="card p-4 border-bg-border bg-bg-surface hover:border-amber-500/40 cursor-pointer transition-all space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Needs Work</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-text-primary">{needsWorkCount}</p>
          <p className="text-[10px] text-text-tertiary">Gaps identified</p>
        </div>

        <div
          onClick={() => onNavigate("topics")}
          className="card p-4 border-bg-border bg-bg-surface hover:border-red-500/40 cursor-pointer transition-all space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Confident Knots</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 ring-2 ring-red-400/20" />
          </div>
          <p className="text-2xl font-bold font-mono text-status-wrong">{knotsCount}</p>
          <p className="text-[10px] text-text-tertiary">Wrong + Sure</p>
        </div>
      </div>

      {/* Target Date & WhatsApp Study Group */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Exam Countdown Card */}
        <div className="card p-5 border-bg-border bg-bg-surface space-y-2">
          <div className="flex items-center justify-between text-xs text-text-tertiary font-mono">
            <span className="flex items-center gap-1.5 text-lime-700 dark:text-lime-300">
              <CalendarBlank size={15} />
              <span>Exam Target</span>
            </span>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="bg-transparent text-[11px] font-mono text-text-secondary border-b border-bg-border focus:outline-none"
            />
          </div>
          <div className="pt-1">
            <p className="text-2xl font-bold font-mono text-text-primary">
              {daysToExam} <span className="text-xs font-normal text-text-tertiary">days remaining</span>
            </p>
            <p className="text-[11px] text-text-secondary mt-1">
              Calibrate high-confidence misconceptions before exam day.
            </p>
          </div>
        </div>

        {/* WhatsApp Share Card */}
        <div className="card p-5 border-bg-border bg-bg-surface space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono text-[#25D366] uppercase flex items-center gap-1">
              <ShareNetwork size={13} />
              <span>Study Group Hub</span>
            </span>
            <p className="text-xs font-medium text-text-primary mt-1">
              Invite Classmates to Diagnostic Room
            </p>
            <p className="text-[11px] text-text-tertiary">
              Host an anonymous diagnostic poll to see where your study group gets stuck.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <a
              href={waShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary py-1.5 px-3 text-[11px] flex items-center justify-center gap-1.5 hover:text-[#25D366] flex-1"
            >
              <ShareNetwork size={13} />
              <span>Share via WhatsApp</span>
            </a>
            <button
              onClick={() => onNavigate("room")}
              className="btn-primary py-1.5 px-3 text-[11px] font-semibold flex items-center justify-center gap-1"
            >
              <span>Judges&apos; Room</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature Hub Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => onNavigate("learn")}
          className="card p-5 cursor-pointer hover:border-lime-500/40 dark:hover:border-lime-300/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-semibold text-lime-700 dark:text-lime-300 flex items-center gap-1">
              <Brain size={13} />
              <span>Interactive Learn</span>
            </span>
            <ArrowRight size={14} className="text-text-tertiary group-hover:text-lime-700 dark:group-hover:text-lime-300 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary group-hover:text-lime-700 dark:group-hover:text-lime-300 transition-colors">
            Topic Masterclass & Study Guide
          </h3>
          <p className="text-xs text-text-tertiary mt-1">
            Structured full-page study guides with core intuition, key rules, common traps, and instant multiple-choice checks.
          </p>
        </div>

        <div
          onClick={() => onNavigate("topics")}
          className="card p-5 cursor-pointer hover:border-lime-500/40 dark:hover:border-lime-300/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-semibold text-lime-700 dark:text-lime-300 flex items-center gap-1">
              <TreeStructure size={13} />
              <span>3D Knowledge Map</span>
            </span>
            <ArrowRight size={14} className="text-text-tertiary group-hover:text-lime-700 dark:group-hover:text-lime-300 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary group-hover:text-lime-700 dark:group-hover:text-lime-300 transition-colors">
            Topic Map & 3D Living Root Tree
          </h3>
          <p className="text-xs text-text-tertiary mt-1">
            Explore syllabus branches and prerequisite foundation roots rendered in 3D Three.js.
          </p>
        </div>

        <div
          onClick={() => onNavigate("exam")}
          className="card p-5 cursor-pointer hover:border-lime-500/40 dark:hover:border-lime-300/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-semibold text-lime-700 dark:text-lime-300 flex items-center gap-1">
              <Exam size={13} />
              <span>Exam Simulation</span>
            </span>
            <ArrowRight size={14} className="text-text-tertiary group-hover:text-lime-700 dark:group-hover:text-lime-300 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary group-hover:text-lime-700 dark:group-hover:text-lime-300 transition-colors">
            5-Question Mock Exam
          </h3>
          <p className="text-xs text-text-tertiary mt-1">
            Multiple-choice questions with confidence tap, followed by cited note evidence and weak-topic priority links.
          </p>
        </div>

        <div
          onClick={() => onNavigate("materials")}
          className="card p-5 cursor-pointer hover:border-lime-500/40 dark:hover:border-lime-300/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-semibold text-lime-700 dark:text-lime-300 flex items-center gap-1">
              <FileText size={13} />
              <span>Course Sources</span>
            </span>
            <ArrowRight size={14} className="text-text-tertiary group-hover:text-lime-700 dark:group-hover:text-lime-300 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary group-hover:text-lime-700 dark:group-hover:text-lime-300 transition-colors">
            In-App Document Viewer
          </h3>
          <p className="text-xs text-text-tertiary mt-1">
            Upload PDFs, Word (.docx) files, and photo notes. Preview documents directly inside Rootwise.
          </p>
        </div>
      </div>
    </div>
  );
}
