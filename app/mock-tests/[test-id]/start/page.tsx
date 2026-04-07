import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import TestEngine from "./TestEngine";
import { getMockAccessState } from "@/lib/mock-test-purchases";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const attemptId =
    resolvedSearchParams?.attemptId && resolvedSearchParams.attemptId !== "undefined"
      ? resolvedSearchParams.attemptId
      : null;

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

  const adminSupabase = createAdminClient();
  if (attemptId) {
    const { data: attempt, error: attemptError } = await adminSupabase
      .from("test_attempts")
      .select("id")
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .eq("test_id", testId)
      .maybeSingle();

    if (attemptError) {
      console.error("Failed to validate test attempt", attemptError);
      redirect("/mock-tests");
    }

    if (!attempt) {
      redirect("/mock-tests");
    }
  }

  const { data: access, error: accessError } = await getMockAccessState(
    adminSupabase,
    user.id,
    testId,
  );

  if (accessError) {
    console.error("Failed to resolve mock access on start page", accessError);
    redirect("/mock-tests");
  }

  if (!attemptId) {
    if (!access?.canAccess) {
      redirect("/mock-tests");
    }

    redirect(`/mock-tests/${testId}`);
  }

  const resolvedAttemptId = attemptId;

  const [testRes, questionsRes] = await Promise.all([
    adminSupabase
      .from("tests")
      .select("duration_minutes")
      .eq("id", testId)
      .single(),
    adminSupabase
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
      attemptId={resolvedAttemptId}
      durationMinutes={test.duration_minutes}
    />
  );
}
