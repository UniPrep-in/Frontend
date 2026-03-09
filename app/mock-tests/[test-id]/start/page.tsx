import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import TestEngine from "./TestEngine";

export default async function StartTestPage({
  params,
  searchParams,
}: {
  params: Promise<{ "test-id": string }>;
  searchParams: Promise<{ attemptId?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const testId = resolvedParams["test-id"];
  const attemptId = resolvedSearchParams?.attemptId;

  console.log("TEST ID:", testId);
  console.log("ATTEMPT ID:", attemptId);

  if (!attemptId) redirect("/mock-tests");

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Validate attempt
  const { data: attempt, error: attemptError } = await supabase
    .from("test_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .eq("test_id", testId)
    .maybeSingle();

  console.log("ATTEMPT DATA:", attempt);
  console.log("ATTEMPT ERROR:", attemptError);

  if (!attempt) redirect("/mock-tests");

  // Fetch test details (for duration)
  const { data: test } = await supabase
    .from("tests")
    .select("duration_minutes")
    .eq("id", testId)
    .single();

  if (!test) redirect("/mock-tests");

  // Fetch questions
  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select(
      `
      id,
      question_text,
      question_order,
      options (
        id,
        option_text
      )
    `
    )
    .eq("test_id", testId)
    .order("question_order", { ascending: true });

  console.log("QUESTIONS:", questions);
  console.log("QUESTIONS ERROR:", questionsError);

  if (!questions || questions.length === 0) {
    console.log("NO QUESTIONS FOUND FOR TEST:", testId);
    redirect("/mock-tests");
  }

  return (
    <TestEngine
      questions={questions}
      attemptId={attemptId}
      durationMinutes={test.duration_minutes}
    />
  );
}
