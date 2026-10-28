import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch user's courses
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, course_code, created_at")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch topics needing revisit (needs_work or developing, for this user)
  const { data: weakTopics } = await supabase
    .from("topic_progress")
    .select(
      "topic_id, status, status_reason, topics(title, course_id, courses(title))"
    )
    .eq("user_id", user.id)
    .in("status", ["needs_work", "developing"])
    .order("updated_at", { ascending: false })
    .limit(5);

interface RawWeakTopicQuery {
  topic_id: string;
  status: string;
  status_reason: string | null;
  topics:
    | {
        title: string;
        course_id: string;
        courses: { title: string } | { title: string }[] | null;
      }
    | {
        title: string;
        course_id: string;
        courses: { title: string } | { title: string }[] | null;
      }[]
    | null;
}

  // Format weakTopics so joined objects match WeakTopic shape
  const rawList = (weakTopics ?? []) as unknown as RawWeakTopicQuery[];
  const formattedWeakTopics = rawList.map((item) => {
    const topicObj = Array.isArray(item.topics) ? item.topics[0] : item.topics;
    const coursesVal = topicObj?.courses;
    const courseObj = Array.isArray(coursesVal) ? coursesVal[0] : coursesVal;

    return {
      topic_id: item.topic_id,
      status: item.status,
      status_reason: item.status_reason,
      topics: topicObj
        ? {
            title: topicObj.title,
            course_id: topicObj.course_id,
            courses: courseObj ? { title: courseObj.title } : null,
          }
        : null,
    };
  });

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email ?? "" }}
      courses={courses ?? []}
      weakTopics={formattedWeakTopics}
    />
  );
}
