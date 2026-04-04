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
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  if (!user) redirect("/auth");

  // Validate attempt
  const { data: attempt } = await supabase
    .from("test_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .eq("test_id", testId)
    .maybeSingle();

  if (!attempt) redirect("/mock-tests");

  const [testRes, questionsRes] = await Promise.all([
    supabase
      .from("tests")
      .select("duration_minutes")
      .eq("id", testId)
      .single(),
    supabase
      .from("questions")
      .select(
        `
      id,
      question_text,
      question_order,
      question_image,
      options (
        id,
        option_text
      )
    `
      )
      .eq("test_id", testId)
      .order("question_order", { ascending: true }),
  ]);

  const test = testRes.data;
  const questions = questionsRes.data;

  if (!test) redirect("/mock-tests");

  if (!questions || questions.length === 0) {
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
