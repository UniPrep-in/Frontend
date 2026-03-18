import { redirect } from "next/navigation";
import Navbar from "@/app/components/ui/Navbar";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
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
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30 py-10 px-4">
      <div>
        <Navbar />
      </div>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Test Submitted
          </h1>
          <p className="text-slate-500 mt-1 font-medium">{testTitle}</p>
        </div>

        {/* Total vs Attempted - prominent strip */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <FileQuestion className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Questions
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {totalQuestions}
                </p>
              </div>
            </div>
            <div className="mt-4 p-4 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-purple-700">
                Total Time Spent
              </p>
              <p className="text-xl font-bold text-purple-900">
                {Math.floor(totalTime / 60)}m {totalTime % 60}s
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Attempted
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {totalAttempted}
                  <span className="text-slate-400 font-normal text-lg">
                    {" "}
                    / {totalQuestions}
                  </span>
                </p>
              </div>
            </div>
            {analytics && analytics.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-slate-700 mb-3">
                  Time Spent per Question
                </p>
                <div className="max-h-60 overflow-y-auto space-y-2">
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

        {/* Score card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden mb-8">
          <div className="bg-linear-to-r from-slate-900 to-slate-800 text-white px-8 py-6">
            <p className="text-sm font-medium text-slate-300 uppercase tracking-wider">
              Your Score
            </p>
            <p className="text-4xl md:text-5xl font-bold mt-1 tracking-tight">
              {attempt.score != null ? attempt.score : "—"}
            </p>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                    Correct
                  </p>
                  <p className="text-2xl font-bold text-emerald-900">
                    {correct}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                <XCircle className="w-6 h-6 text-red-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">
                    Wrong
                  </p>
                  <p className="text-2xl font-bold text-red-900">{wrong}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-100 border border-slate-200">
                <Circle className="w-6 h-6 text-slate-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Unattempted
                  </p>
                  <p className="text-2xl font-bold text-slate-800">
                    {unattempted}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div className="w-6 h-6 flex items-center justify-center shrink-0 text-blue-600 font-bold text-sm">
                  %
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                    Accuracy
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {accuracy}%
                  </p>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">
                Attempt breakdown
              </p>
              <div className="h-4 rounded-full bg-slate-200 overflow-hidden flex">
                {totalQuestions > 0 && (
                  <>
                    <div
                      className="bg-emerald-500 transition-all duration-300"
                      style={{
                        width: `${(correct / totalQuestions) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-red-400 transition-all duration-300"
                      style={{
                        width: `${(wrong / totalQuestions) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-slate-300 transition-all duration-300"
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
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
