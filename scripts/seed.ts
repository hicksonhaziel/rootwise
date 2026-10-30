import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  console.log("\n=================================================");
  console.log("  Rootwise — MTH101 Demo Course Seeder");
  console.log("  Seeding Calculus syllabus, notes, and topics...");
  console.log("=================================================\n");

  // 1. Get or create a demo user
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  let userId: string;

  if (userError || !users?.users?.length) {
    console.log("Creating default demo student account (demo@rootwise.edu)...");
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: "demo@rootwise.edu",
      password: "password123",
      email_confirm: true,
    });
    if (createError || !newUser.user) {
      console.error("Failed to create demo user:", createError);
      process.exit(1);
    }
    userId = newUser.user.id;
  } else {
    userId = users.users[0].id;
    console.log(`Using user: ${users.users[0].email} (${userId})`);
  }

  // 2. Create MTH101 course
  console.log("Creating MTH101 (Calculus) course...");
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .insert({
      owner_user_id: userId,
      title: "MTH101 (Demo data — synthetic)",
      course_code: "MTH101",
    })
    .select()
    .single();

  if (courseError || !course) {
    console.error("Failed to create course:", courseError);
    process.exit(1);
  }

  const courseId = course.id;
  console.log(`Course created with ID: ${courseId}`);

  // Add course membership
  await supabase.from("course_members").upsert({
    course_id: courseId,
    user_id: userId,
    role: "owner",
    group_sharing_opt_in: true,
  });

  // 3. Create Course Topics
  const topicsData = [
    {
      course_id: courseId,
      title: "Limits and Continuity",
      description: "Concept of approaching a target value, indeterminate forms 0/0, one-sided limits, and removable discontinuities.",
      created_by: "system",
    },
    {
      course_id: courseId,
      title: "Differentiation & Tangent Lines",
      description: "Derivatives as instantaneous rate of change, power rule, differentiability, and sharp corner non-differentiability.",
      created_by: "system",
    },
    {
      course_id: courseId,
      title: "The Chain Rule",
      description: "Derivative of composite functions f(g(x)), inner derivative multiplication, and exponential/trigonometric composition.",
      created_by: "system",
    },
    {
      course_id: courseId,
      title: "Extrema & Optimization",
      description: "Critical numbers, first and second derivative tests, concavity, inflection points, and curve sketching.",
      created_by: "system",
    },
    {
      course_id: courseId,
      title: "Definite Integrals & Fundamental Theorem",
      description: "Riemann sums, antiderivatives, net area under curves, and evaluation via the Fundamental Theorem of Calculus.",
      created_by: "system",
    },
  ];

  console.log("Seeding syllabus topics...");
  const { data: topics, error: topicsError } = await supabase
    .from("topics")
    .insert(topicsData)
    .select();

  if (topicsError) {
    console.warn("Topics note:", topicsError.message);
  } else {
    console.log(`Inserted ${topics?.length} topics.`);
  }

  // 4. Create Source Material & Grounded Lecture Chunks
  console.log("Seeding lecture notes and verified source chunks...");
  const { data: source, error: sourceError } = await supabase
    .from("sources")
    .insert({
      course_id: courseId,
      uploaded_by: userId,
      filename: "MTH101_Lecture_Notes_Calculus.pdf",
      mime_type: "application/pdf",
      storage_path: `courses/${courseId}/MTH101_Lecture_Notes_Calculus.pdf`,
      processing_status: "ready",
      page_count: 52,
    })
    .select()
    .single();

  if (!sourceError && source) {
    const chunks = [
      {
        course_id: courseId,
        source_id: source.id,
        page_number: 14,
        chunk_index: 0,
        text: "CHAPTER 2: LIMITS AND CONTINUITY. The limit of a function f(x) as x approaches c is L if the values of f(x) can be made arbitrarily close to L by taking x sufficiently close to c. Direct substitution yielding 0/0 is an indeterminate form, requiring algebraic factoring (x^2 - 1) = (x - 1)(x + 1) to evaluate neighborhood convergence.",
      },
      {
        course_id: courseId,
        source_id: source.id,
        page_number: 18,
        chunk_index: 1,
        text: "DEFINITION OF CONTINUITY: A function f is continuous at x = c if: (1) f(c) is defined; (2) lim_{x->c} f(x) exists; and (3) lim_{x->c} f(x) = f(c). A removable discontinuity has an existing limit but fails condition (3). Therefore, limit existence does not imply continuity.",
      },
      {
        course_id: courseId,
        source_id: source.id,
        page_number: 30,
        chunk_index: 2,
        text: "CHAPTER 3: DIFFERENTIATION. Continuity does not guarantee differentiability. The absolute value function f(x) = |x| is continuous everywhere on R, but possesses a sharp corner at x = 0 where the left-hand derivative is -1 and right-hand derivative is +1. Because one-sided derivative limits disagree, f'(0) does not exist.",
      },
      {
        course_id: courseId,
        source_id: source.id,
        page_number: 34,
        chunk_index: 3,
        text: "THE CHAIN RULE: If y = f(u) is differentiable at u = g(x) and u = g(x) is differentiable at x, then the composite function y = f(g(x)) is differentiable with dy/dx = f'(g(x)) * g'(x). A common error is neglecting the inner derivative g'(x), erroneously writing d/dx[sin(3x)] = cos(3x) rather than 3*cos(3x).",
      },
      {
        course_id: courseId,
        source_id: source.id,
        page_number: 45,
        chunk_index: 4,
        text: "CHAPTER 5: THE DEFINITE INTEGRAL. By the Fundamental Theorem of Calculus, if f is continuous on [a, b] and F is any antiderivative of f, then integral from a to b of f(x) dx = F(b) - F(a). Evaluating integrals requires recognizing reverse power rules where integral of x^n dx = (x^(n+1))/(n+1) for n != -1.",
      },
    ];

    await supabase.from("source_chunks").insert(chunks);
    console.log(`Inserted ${chunks.length} grounded lecture note chunks.`);
  }

  console.log("\n✓ Seeding complete!");
  console.log(`  Course URL: http://localhost:3000/courses/${courseId}`);
  console.log("=================================================\n");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
