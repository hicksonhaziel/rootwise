"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RootwiseLogo } from "@/components/ui/rootwise-logo";
import { CreateCourseModal } from "@/components/course/create-course-modal";
import { CourseCard } from "@/components/course/course-card";
import { TopicRevisitList } from "@/components/course/topic-revisit-list";
import { Plus, SignOut } from "@phosphor-icons/react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface Course {
  id: string;
  title: string;
  course_code: string | null;
  created_at: string;
}

interface WeakTopic {
  topic_id: string;
  status: string;
  status_reason: string | null;
  topics: {
    title: string;
    course_id: string;
    courses: { title: string } | null;
  } | null;
}

interface Props {
  user: { id: string; email: string };
  courses: Course[];
  weakTopics: WeakTopic[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function DashboardClient({ user, courses: initialCourses, weakTopics }: Props) {
  const [courses, setCourses] = useState(initialCourses);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const greeting = getGreeting();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleCourseCreated(course: Course) {
    setCourses((prev) => [course, ...prev]);
    setShowCreateModal(false);
  }

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Top nav */}
      <nav className="border-b border-bg-border bg-bg-base/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <RootwiseLogo variant="wordmark" size={28} />

          <div className="flex items-center gap-3">
            <span className="text-xs text-text-secondary bg-bg-surface border border-bg-border px-2.5 py-1 rounded-md font-mono hidden sm:inline-block">
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="p-1.5 text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated rounded-md transition-all"
              title="Sign out"
            >
              <SignOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-10"
        >
          {/* Header */}
          <motion.div variants={itemVariants}>
            <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
              {greeting}
            </h1>
            <p className="mt-1 text-text-secondary">
              {courses.length === 0
                ? "Create your first course to get started."
                : `You have ${courses.length} course${courses.length === 1 ? "" : "s"}.`}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
            {/* Courses grid */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                  Your courses
                </h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-1.5 text-xs text-lime-300 hover:text-lime-400 font-medium transition-colors"
                >
                  <Plus size={14} weight="bold" />
                  New course
                </button>
              </div>

              {courses.length === 0 ? (
                <motion.button
                  onClick={() => setShowCreateModal(true)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full border-2 border-dashed border-bg-border rounded-lg py-16 text-center hover:border-lime-300/30 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-bg-elevated flex items-center justify-center mx-auto mb-3 group-hover:bg-lime-300/10 transition-colors">
                    <Plus size={24} className="text-text-tertiary group-hover:text-lime-300 transition-colors" />
                  </div>
                  <p className="text-text-secondary font-medium">Create your first course</p>
                  <p className="text-sm text-text-tertiary mt-1">
                    Upload a PDF or paste your notes
                  </p>
                </motion.button>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {courses.map((course, i) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: i * 0.06,
                          duration: 0.3,
                          ease: [0.16, 1, 0.3, 1] as const,
                        }}
                      >
                        <CourseCard course={course} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>

            {/* Sidebar — topics to revisit */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                Topics to revisit
              </h2>
              <TopicRevisitList topics={weakTopics} />
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Create course modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateCourseModal
            onClose={() => setShowCreateModal(false)}
            onCreated={handleCourseCreated}
          />
        )}
      </AnimatePresence>

      {/* FAB — create course (mobile) */}
      <motion.button
        onClick={() => setShowCreateModal(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 bg-lime-300 text-text-inverse rounded-full w-12 h-12 flex items-center justify-center shadow-md sm:hidden hover:bg-lime-400 transition-colors"
        aria-label="Create course"
      >
        <Plus size={20} weight="bold" />
      </motion.button>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
