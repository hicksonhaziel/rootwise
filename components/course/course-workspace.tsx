"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { RootwiseLogo } from "@/components/ui/rootwise-logo";
import { MaterialsTab } from "@/components/sources/materials-tab";
import { TopicsTab } from "@/components/course/topics-tab";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Brain,
  MapTrifold,
  Exam,
  UsersThree,
  ArrowRight,
} from "@phosphor-icons/react";

interface Course {
  id: string;
  title: string;
  course_code: string | null;
  created_at: string;
}

type Tab = "overview" | "materials" | "topics" | "learn" | "exam" | "room";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "materials", label: "Materials", icon: FileText },
  { id: "topics", label: "Topic Map", icon: MapTrifold },
  { id: "learn", label: "Learn", icon: Brain },
  { id: "exam", label: "Exam", icon: Exam },
  { id: "room", label: "Room", icon: UsersThree },
];

export function CourseWorkspace({ course }: { course: Course }) {
  const [activeTab, setActiveTab] = useState<Tab>("materials");
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Top nav */}
      <nav className="border-b border-bg-border bg-bg-base/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-1.5 text-text-tertiary hover:text-text-primary rounded-md transition-colors"
              title="Back to dashboard"
            >
              <ArrowLeft size={16} weight="bold" />
            </button>
            <RootwiseLogo variant="mark" size={22} />
            <div className="flex items-center gap-2">
              {course.course_code && (
                <span className="text-[11px] font-mono font-medium text-lime-300 bg-lime-300/10 border border-lime-300/20 px-2 py-0.5 rounded">
                  {course.course_code}
                </span>
              )}
              <span className="text-sm font-medium text-text-primary truncate max-w-[300px]">
                {course.title}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab bar */}
      <div className="border-b border-bg-border bg-bg-surface/40">
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
                        ? "text-lime-300 font-semibold"
                        : "text-text-tertiary hover:text-text-secondary"
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeWorkspaceTab"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      className="absolute inset-0 bg-lime-300/10 border border-lime-300/25 rounded-md"
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
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
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
              onSelectTopicForDiagnostic={() => setActiveTab("learn")}
            />
          )}
          {activeTab === "learn" && (
            <ComingSoon label="Diagnostic Learning Loop" phase="Phase 2" />
          )}
          {activeTab === "exam" && (
            <ComingSoon label="Exam Practice" phase="Phase 3" />
          )}
          {activeTab === "room" && (
            <ComingSoon label="Judges' Study Room" phase="Phase 4" />
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
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="flex items-center gap-2 mb-2">
          {course.course_code && (
            <span className="text-xs font-mono text-lime-300 bg-lime-300/10 border border-lime-300/20 px-2 py-0.5 rounded">
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
          Rootwise analyzes your lecture materials, pinpoints underlying conceptual gaps, and helps you master university exam topics.
        </p>
      </div>

      {/* Getting started steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => onNavigate("materials")}
          className="card p-5 cursor-pointer hover:border-bg-border-focus transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-lime-300">Step 1</span>
            <ArrowRight size={14} className="text-text-tertiary group-hover:text-lime-300 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-medium text-text-primary group-hover:text-lime-300 transition-colors">
            Upload Materials
          </h3>
          <p className="text-xs text-text-tertiary mt-1">
            Drop course PDFs or paste notes. Text is extracted, chunked, and indexed for search.
          </p>
        </div>

        <div
          onClick={() => onNavigate("topics")}
          className="card p-5 cursor-pointer hover:border-bg-border-focus transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-lime-300">Step 2</span>
            <ArrowRight size={14} className="text-text-tertiary group-hover:text-lime-300 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-medium text-text-primary group-hover:text-lime-300 transition-colors">
            Topic Outline
          </h3>
          <p className="text-xs text-text-tertiary mt-1">
            Review AI-proposed topics extracted from your notes. Edit, add or customize your syllabus.
          </p>
        </div>
      </div>
    </div>
  );
}

function ComingSoon({ label, phase }: { label: string; phase: string }) {
  return (
    <div className="card p-12 text-center max-w-md mx-auto">
      <Brain size={32} className="mx-auto text-text-tertiary mb-3" />
      <h3 className="text-sm font-medium text-text-primary">{label}</h3>
      <p className="text-xs text-text-tertiary mt-1">
        Scheduled for {phase}. Core sources and chunk retrieval are active.
      </p>
    </div>
  );
}
