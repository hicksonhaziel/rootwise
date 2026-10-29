import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { CourseWorkspace } from "@/components/course/course-workspace";

interface Props {
  params: Promise<{ courseId: string }>;
  searchParams?: Promise<{ tab?: string; topic?: string }>;
}

export default async function CoursePage({ params, searchParams }: Props) {
  const { courseId } = await params;
  const { tab, topic } = (await searchParams) ?? {};
  const supabase = await createClient();

  const [userRes, courseRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("courses")
      .select("id, title, course_code, created_at")
      .eq("id", courseId)
      .single(),
  ]);

  if (!userRes.data.user) redirect("/login");
  if (courseRes.error || !courseRes.data) redirect("/dashboard");

  const validTabs = ["overview", "materials", "topics", "learn", "exam", "room"] as const;
  const initialTab =
    tab && (validTabs as readonly string[]).includes(tab)
      ? (tab as (typeof validTabs)[number])
      : topic
      ? "learn"
      : "materials";

  return (
    <CourseWorkspace
      course={courseRes.data}
      initialTab={initialTab}
      initialTopicId={topic ?? null}
    />
  );
}
