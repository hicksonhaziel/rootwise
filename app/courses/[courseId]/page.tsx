import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { CourseWorkspace } from "@/components/course/course-workspace";

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function CoursePage({ params }: Props) {
  const { courseId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: course, error } = await supabase
    .from("courses")
    .select("id, title, course_code, created_at")
    .eq("id", courseId)
    .single();

  if (error || !course) redirect("/dashboard");

  return <CourseWorkspace course={course} />;
}
