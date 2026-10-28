"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react";

interface Course {
  id: string;
  title: string;
  course_code: string | null;
  created_at: string;
}

export function CourseCard({ course }: { course: Course }) {
  const router = useRouter();

  return (
    <motion.div
      onClick={() => router.push(`/courses/${course.id}`)}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="card p-5 cursor-pointer flex flex-col justify-between h-[180px] group select-none hover:border-lime-300/30 transition-colors"
    >
      <div>
        {/* Top meta row */}
        <div className="flex items-center justify-between mb-3">
          {course.course_code ? (
            <span className="text-[11px] font-mono font-medium text-lime-300 bg-lime-300/10 border border-lime-300/20 px-2 py-0.5 rounded">
              {course.course_code}
            </span>
          ) : (
            <span className="text-[11px] font-mono text-text-tertiary bg-bg-elevated px-2 py-0.5 rounded">
              Course
            </span>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-status-developing" />
            <span>Active</span>
          </div>
        </div>

        {/* Course title */}
        <h3 className="font-medium text-text-primary text-[15px] leading-snug line-clamp-2 group-hover:text-lime-300 transition-colors">
          {course.title}
        </h3>
      </div>

      {/* Bottom link row */}
      <div className="pt-3 border-t border-bg-border/60 flex items-center justify-between">
        <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors flex items-center gap-1.5">
          Open Workspace
          <ArrowRight
            size={12}
            weight="bold"
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </span>
        <span className="text-[11px] text-text-tertiary">
          {new Date(course.created_at).toLocaleDateString("en", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </motion.div>
  );
}
