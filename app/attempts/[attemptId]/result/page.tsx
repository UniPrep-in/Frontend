import { redirect } from "next/navigation";
import Navbar from "@/app/components/ui/Navbar";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import Footer from "@/app/components/Footer";
import {
  CheckCircle2,
  XCircle,
  Circle,
  ArrowLeft,
  Home,
  FileQuestion,
  Target,
} from "lucide-react";

interface Props {
  params: Promise<{ attemptId: string }>;
}

export default async function ResultPage({ params }: Props) {
  const resolvedParams = await params;
  const attemptId = resolvedParams.attemptId;

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

  const { data: attempt } = await supabase
    .from("test_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single();

  if (!attempt) redirect("/mock-tests");

  if (!attempt.completed_at) {
    redirect("/mock-tests");
  }

  let testTitle = "Here is Your Result";
  const { data: test } = await supabase
    .from("tests")
    .select("title, name")
    .eq("id", attempt.test_id)
    .maybeSingle();
  if (test) {
    testTitle =
      (test as { title?: string; name?: string }).title ??
      (test as { title?: string; name?: string }).name ??
      testTitle;
  }

  const { data: answers } = await supabase
    .from("user_answers")
    .select("is_correct")
    .eq("attempt_id", attemptId);

  const { data: analytics } = await supabase
    .from("question_analytics")
    .select("question_id, time_spent")
    .eq("attempt_id", attemptId)
    .eq("user_id", user.id);

  const { count: totalInTest } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("test_id", attempt.test_id);

  const totalAttempted = answers?.length ?? 0;
  const correct = answers?.filter((a) => a.is_correct).length ?? 0;
  const wrong = totalAttempted - correct;
  const totalQuestions = totalInTest ?? totalAttempted;
  const unattempted = Math.max(0, totalQuestions - totalAttempted);
  const accuracy =
    totalAttempted > 0
      ? Math.round((correct / totalAttempted) * 100)
      : 0;

  const totalTime =
    analytics?.reduce((sum, a) => sum + (a.time_spent || 0), 0) ?? 0;

  return (
    <main className="bg-neutral-100">
      <div>
        <Navbar />
      </div>
      <div className="max-w-6xl mx-auto py-12">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Test Submitted
          </h1>
          <p className="text-slate-500 mt-1 font-medium">{testTitle}</p>
        </div>

        {/* Score card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden mb-8">
          <div className="bg-blue-300 px-8 py-6 flex justify-center gap-2 items-center">
            <p className="text-4xl font-semibold text-black">
              You Scored:
            </p>
            <p className="text-4xl font-bold black">
              {attempt.score != null ? attempt.score : "—"}/{totalQuestions}
            </p>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-emerald-300 border">
                <CheckCircle2 className="w-6 h-6 text-black shrink-0" />
                <div className="min-w-0 flex items-center justify-center gap-2">
                  <p className="text-xl font-semibold text-black">
                    Correct:
                  </p>
                  <p className="text-xl font-bold text-black">
                    {correct}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-rose-300 border">
                <XCircle className="w-6 h-6 text-black shrink-0" />
                <div className="min-w-0 flex items-center justify-center gap-2">
                  <p className="text-xl font-semibold text-black">
                    Wrong:
                  </p>
                  <p className="text-xl font-bold text-black">{wrong}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-amber-300 border">
                <Circle className="w-6 h-6 text-black shrink-0" />
                <div className="min-w-0 flex items-center justify-center gap-2">
                  <p className="text-xl font-semibold text-black">
                    Unattempted:
                  </p>
                  <p className="text-xl font-bold text-black">
                    {unattempted}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-blue-300 border">
                <div className="w-6 h-6 flex items-center justify-center shrink-0 text-black font-bold text-sm">
                  %
                </div>
                <div className="min-w-0 flex items-center justify-center gap-2">
                  <p className="text-xl font-semibold text-black">
                    Accuracy:
                  </p>
                  <p className="text-xl font-bold text-black">
                    {accuracy}%
                  </p>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <p className="text-sm font-semibold text-black mb-3">
                Attempt breakdown
              </p>
              <div className="h-4 rounded-full bg-neutral-300 overflow-hidden flex">
                {totalQuestions > 0 && (
                  <>
                    <div
                      className="bg-emerald-300 transition-all duration-300"
                      style={{
                        width: `${(correct / totalQuestions) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-red-300 transition-all duration-300"
                      style={{
                        width: `${(wrong / totalQuestions) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-neutral-300 transition-all duration-300"
                      style={{
                        width: `${(unattempted / totalQuestions) * 100}%`,
                      }}
                    />
                  </>
                )}
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                <span>Correct</span>
                <span>Wrong</span>
                <span>Unattempted</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
              <span>
                <strong className="text-slate-800">Total attempted:</strong>{" "}
                {totalAttempted} of {totalQuestions} questions
              </span>
            </div>
          </div>

          {/* Total vs Attempted - prominent strip */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="border-t border-b border-neutral-200 px-8 py-4 overflow-hidden flex justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Questions
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {totalQuestions}
                </p>
              </div>
            </div>
            <div className="mt-4 p-4 rounded-xl bg-purple-50 border border-purple-100">
              <p className="text-sm font-semibold text-purple-700">
                Total Time Spent
              </p>
              <p className="text-xl font-bold text-purple-900">
                {Math.floor(totalTime / 60)}m {totalTime % 60}s
              </p>
            </div>
          </div>
          <div className="px-8 overflow-hidden">
            {analytics && analytics.length > 0 && (
              <div className="">
                <p className="text-lg font-semibold text-black my-3">
                  Time Spent on each attempted Question
                </p>
                <div className="overflow-y-auto space-y-2">
                  {analytics.map((item, index) => (
                    <div
                      key={item.question_id}
                      className="flex items-center justify-between px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm"
                    >
                      <span className="text-slate-600">
                        Question {index + 1}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {Math.floor(item.time_spent / 60)}m{" "}
                        {item.time_spent % 60}s
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/mock-tests"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tests
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            See Leaderboards
          </Link>
        </div>
      </div>

      <div>
        <Footer />
      </div>
    </main>
  );
}
