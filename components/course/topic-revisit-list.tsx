"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

const STATUS_CONFIG = {
  needs_work: { dot: "bg-status-needs-work", label: "Needs work" },
  developing: { dot: "bg-status-developing", label: "Developing" },
};

export function TopicRevisitList({ topics }: { topics: WeakTopic[] }) {
  if (topics.length === 0) {
    return (
      <p className="text-sm text-text-tertiary py-4">
        No topics flagged for revisit yet.{" "}
        <span className="block mt-1">Start diagnosing a course to see results here.</span>
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {topics.map((t, i) => {
        const config =
          STATUS_CONFIG[t.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.needs_work;
        const href = t.topics?.course_id
          ? `/courses/${t.topics.course_id}?tab=topics`
          : "#";

        return (
          <motion.div
            key={t.topic_id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <Link
              href={href}
              prefetch={true}
              className="block w-full text-left card px-4 py-3 hover:border-bg-border/80 group transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className={cn("status-dot", config.dot)} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {t.topics?.title ?? "Unknown topic"}
                  </p>
                  <p className="text-xs text-text-tertiary truncate mt-0.5">
                    {t.topics?.courses?.title ?? ""} · {config.label}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
