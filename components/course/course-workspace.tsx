"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { RootwiseLogo } from "@/components/ui/rootwise-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { MaterialsTab } from "@/components/sources/materials-tab";
import { TopicsTab } from "@/components/course/topics-tab";
import { DiagnosticSession } from "@/components/learning/diagnostic-session";
import { ExamTab } from "@/components/learning/exam-tab";
import { FixTundeTab } from "@/components/learning/fix-tunde-tab";
import { RoomTab } from "@/components/course/room-tab";
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
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(initialTopicId);

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Top nav */}
      <nav className="border-b border-bg-border bg-bg-base/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              prefetch={true}
              className="p-1.5 text-text-tertiary hover:text-text-primary rounded-md transition-colors inline-flex items-center justify-center"
              title="Back to dashboard"
            >
              <ArrowLeft size={16} weight="bold" />
            </Link>
            <RootwiseLogo variant="mark" size={22} />
            <div className="flex items-center gap-2">
              {course.course_code && (
                <span className="text-[11px] font-mono font-medium text-lime-700 dark:text-lime-300 bg-lime-500/10 dark:bg-lime-300/10 border border-lime-500/20 dark:border-lime-300/20 px-2 py-0.5 rounded">
                  {course.course_code}
                </span>
              )}
              <span className="text-sm font-medium text-text-primary truncate max-w-[300px]">
                {course.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Tab bar */}
      <div className="border-b border-bg-border bg-bg-surface/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-2 -mb-px overflow-x-auto py-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap rounded-md
                    ${
                      isActive
                        ? "text-lime-700 dark:text-lime-300 font-semibold"
                        : "text-text-tertiary hover:text-text-secondary"
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeWorkspaceTab"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      className="absolute inset-0 bg-lime-500/10 dark:bg-lime-300/10 border border-lime-500/25 dark:border-lime-300/25 rounded-md"
                    />
                  )}
                  <Icon size={14} weight={isActive ? "fill" : "regular"} className="relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
          >
            {activeTab === "overview" && (
              <OverviewTab
                course={course}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}
            {activeTab === "materials" && (
              <MaterialsTab
                courseId={course.id}
                onNavigateToTopics={() => setActiveTab("topics")}
              />
            )}
            {activeTab === "topics" && (
              <TopicsTab
                courseId={course.id}
                onSelectTopicForDiagnostic={(topicId) => {
                  setSelectedTopicId(topicId);
                  setActiveTab("learn");
                }}
              />
            )}
            {activeTab === "learn" && (
              <DiagnosticSession
                courseId={course.id}
                initialTopicId={selectedTopicId}
                onNavigateToTopics={() => setActiveTab("topics")}
              />
            )}
            {activeTab === "exam" && (
              <ExamTab
                courseId={course.id}
                onNavigateToTopicDiagnostic={(topicId) => {
                  setSelectedTopicId(topicId);
                  setActiveTab("learn");
                }}
              />
            )}
            {activeTab === "tunde" && (
              <FixTundeTab courseId={course.id} />
            )}
            {activeTab === "room" && (
              <RoomTab courseId={course.id} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function OverviewTab({
  course,
  onNavigate,
}: {
  course: Course;
  onNavigate: (tab: Tab) => void;
}) {
  const [examDate, setExamDate] = useState("2026-11-15");

  const daysToExam = Math.max(
    0,
    Math.ceil(
      (new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const waShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `Studying for ${course.course_code || course.title} with Rootwise! Check out the misconception finder here.`
  )}`;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Course Banner */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          {course.course_code && (
            <span className="text-xs font-mono font-medium text-lime-700 dark:text-lime-300 bg-lime-500/10 dark:bg-lime-300/10 border border-lime-500/20 dark:border-lime-300/20 px-2 py-0.5 rounded">
              {course.course_code}
            </span>
          )}
          <span className="text-xs text-text-tertiary font-mono">
            Created {new Date(course.created_at).toLocaleDateString()}
          </span>
        </div>
        <h2 className="text-xl font-semibold text-text-primary">
          {course.title}
        </h2>
        <p className="text-xs text-text-secondary mt-1">
          Rootwise analyzes your lecture materials, pinpoints underlying conceptual gaps, and calibrates confidence to prepare you for university exams.
        </p>
      </div>

      {/* Small Wins: Exam Countdown & Fix First Target (BUILD.md §3.6) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              {daysToExam} <span className="text-xs font-normal text-text-tertiary">days left</span>
            </p>
            <p className="text-[11px] text-text-secondary mt-1">
              Time to calibrate high-confidence errors before exam day.
            </p>
          </div>
        </div>

        {/* Fix First Priority */}
        <div
          onClick={() => onNavigate("topics")}
          className="card p-5 border-bg-border bg-bg-surface space-y-2 cursor-pointer hover:border-lime-500/30 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-lime-700 dark:text-lime-300 uppercase">
              Fix First Priority
            </span>
            <ArrowRight size={13} className="text-text-tertiary group-hover:text-lime-700 dark:group-hover:text-lime-300 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-xs font-medium text-text-primary">
            Clear Confident-Wrong Knots
          </p>
          <p className="text-[11px] text-text-tertiary">
            Prioritize topics where you chose &quot;Sure&quot; on an incorrect diagnosis.
          </p>
        </div>

        {/* Anonymous WhatsApp Challenge (BUILD.md §3.6) */}
        <div className="card p-5 border-bg-border bg-bg-surface space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono text-[#25D366] uppercase flex items-center gap-1">
              <ShareNetwork size={13} />
              <span>WhatsApp Share</span>
            </span>
            <p className="text-xs font-medium text-text-primary mt-1">
              Challenge Study Group
            </p>
            <p className="text-[11px] text-text-tertiary">
              Invite coursemates to an anonymous diagnostic room.
            </p>
          </div>
          <a
            href={waShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary py-1.5 px-3 text-[11px] flex items-center justify-center gap-1.5 hover:text-[#25D366]"
          >
            <ShareNetwork size={13} />
            <span>Share via WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => onNavigate("materials")}
          className="card p-5 cursor-pointer hover:border-lime-500/40 dark:hover:border-lime-300/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-semibold text-lime-700 dark:text-lime-300">Phase 1</span>
            <ArrowRight size={14} className="text-text-tertiary group-hover:text-lime-700 dark:group-hover:text-lime-300 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-medium text-text-primary group-hover:text-lime-700 dark:group-hover:text-lime-300 transition-colors">
            Lecture Materials & Chunks
          </h3>
          <p className="text-xs text-text-tertiary mt-1">
            Drop course PDFs or paste notes. Text is extracted, chunked, and indexed for Postgres FTS retrieval.
          </p>
        </div>

        <div
          onClick={() => onNavigate("topics")}
          className="card p-5 cursor-pointer hover:border-lime-500/40 dark:hover:border-lime-300/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-semibold text-lime-700 dark:text-lime-300">Phase 3</span>
            <ArrowRight size={14} className="text-text-tertiary group-hover:text-lime-700 dark:group-hover:text-lime-300 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-medium text-text-primary group-hover:text-lime-700 dark:group-hover:text-lime-300 transition-colors">
            Topic Map & 3D Living Root Tree
          </h3>
          <p className="text-xs text-text-tertiary mt-1">
            Visualize your knowledge canopy and prerequisite roots in Three.js. Inspect attempt logs and status rationale.
          </p>
        </div>

        <div
          onClick={() => onNavigate("exam")}
          className="card p-5 cursor-pointer hover:border-lime-500/40 dark:hover:border-lime-300/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-semibold text-lime-700 dark:text-lime-300">Phase 3</span>
            <ArrowRight size={14} className="text-text-tertiary group-hover:text-lime-700 dark:group-hover:text-lime-300 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-medium text-text-primary group-hover:text-lime-700 dark:group-hover:text-lime-300 transition-colors">
            5-Question Mock Exam
          </h3>
          <p className="text-xs text-text-tertiary mt-1">
            Test under real exam conditions with no hints, followed by cited note evidence and weak-topic links.
          </p>
        </div>

        <div
          onClick={() => onNavigate("tunde")}
          className="card p-5 cursor-pointer hover:border-lime-500/40 dark:hover:border-lime-300/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-semibold text-lime-700 dark:text-lime-300">Phase 3</span>
            <ArrowRight size={14} className="text-text-tertiary group-hover:text-lime-700 dark:group-hover:text-lime-300 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-medium text-text-primary group-hover:text-lime-700 dark:group-hover:text-lime-300 transition-colors">
            Fix Tunde Peer Challenge
          </h3>
          <p className="text-xs text-text-tertiary mt-1">
            Find the planted misconception in your classmate&apos;s answer and correct his reasoning against the AI evaluator.
          </p>
        </div>
      </div>
    </div>
  );
}
