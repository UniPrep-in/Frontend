import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock3,
  Target,
  XCircle,
} from "lucide-react";

import { getAttemptReviewData } from "../review-data";
import ViewSolutionsGate from "./components/ViewSolutionsGate";

interface Props {
  params: Promise<{ attemptId: string }>;
}

export default async function ResultPage({ params }: Props) {
  const { attemptId } = await params;
  const reviewData = await getAttemptReviewData(attemptId);

  return (
    <main className="bg-neutral-100">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Test Submitted
          </h1>
          <p className="mt-1 font-medium text-slate-500">{reviewData.testTitle}</p>
        </div>

        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50">
          <div className="flex justify-center gap-2 bg-blue-300 px-8 py-6">
            <p className="text-4xl font-semibold text-black">You Scored:</p>
            <p className="text-4xl font-bold text-black">
              {reviewData.score != null ? reviewData.score : "—"}/{reviewData.totalMarks}
            </p>
          </div>

          <div className="space-y-6 p-6 md:p-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="flex items-center justify-center gap-3 rounded-xl border bg-emerald-300 p-4">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-black" />
                <div className="flex min-w-0 items-center justify-center gap-2">
                  <p className="text-xl font-semibold text-black">Correct:</p>
                  <p className="text-xl font-bold text-black">{reviewData.correct}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 rounded-xl border bg-rose-300 p-4">
                <XCircle className="h-6 w-6 shrink-0 text-black" />
                <div className="flex min-w-0 items-center justify-center gap-2">
                  <p className="text-xl font-semibold text-black">Wrong:</p>
                  <p className="text-xl font-bold text-black">{reviewData.wrong}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 rounded-xl border bg-amber-300 p-4">
                <Circle className="h-6 w-6 shrink-0 text-black" />
                <div className="flex min-w-0 items-center justify-center gap-2">
                  <p className="text-xl font-semibold text-black">Unattempted:</p>
                  <p className="text-xl font-bold text-black">{reviewData.unattempted}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 rounded-xl border bg-blue-300 p-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center text-sm font-bold text-black">
                  %
                </div>
                <div className="flex min-w-0 items-center justify-center gap-2">
                  <p className="text-xl font-semibold text-black">Accuracy:</p>
                  <p className="text-xl font-bold text-black">{reviewData.accuracy}%</p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-black">Attempt breakdown</p>
              <div className="flex h-4 overflow-hidden rounded-full bg-neutral-300">
                {reviewData.totalQuestions > 0 ? (
                  <>
                    <div
                      className="bg-emerald-300 transition-all duration-300"
                      style={{
                        width: `${(reviewData.correct / reviewData.totalQuestions) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-red-300 transition-all duration-300"
                      style={{
                        width: `${(reviewData.wrong / reviewData.totalQuestions) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-neutral-300 transition-all duration-300"
                      style={{
                        width: `${(reviewData.unattempted / reviewData.totalQuestions) * 100}%`,
                      }}
                    />
                  </>
                ) : null}
              </div>
              <div className="mt-2 flex justify-between text-xs font-medium text-slate-500">
                <span>Correct</span>
                <span>Wrong</span>
                <span>Unattempted</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-y border-slate-200 py-4 text-sm text-slate-600">
              <span className="text-lg">
                <strong className="text-slate-800">Total attempted:</strong>{" "}
                {reviewData.totalAttempted} of {reviewData.totalQuestions} questions
              </span>

              <div className="rounded-xl border bg-purple-300 p-4">
                <div className="flex items-center justify-center gap-2">
                  <Clock3 className="h-5 w-5 text-black" />
                  <p className="text-xl font-semibold text-black">Total Time Spent:</p>
                  <p className="text-xl font-bold text-purple-900">
                    {Math.floor(reviewData.totalTime / 60)}m {reviewData.totalTime % 60}s
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 px-6 py-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Review
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">
                    Review every answer in a focused solutions space
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Jump question by question to compare your response with the correct answer and explanation.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <ViewSolutionsGate attemptId={reviewData.attemptId} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/mock-tests"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 font-semibold text-white shadow-lg shadow-slate-900/20 transition-colors hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tests
          </Link>

          <Link
            href={`/mock-tests/${reviewData.testId}/leaderboard`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-500"
          >
            <Target className="h-4 w-4" />
            View Leaderboard
          </Link>
        </div>
      </div>
    </main>
  );
}
