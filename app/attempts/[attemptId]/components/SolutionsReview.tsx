"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock3,
  Flag,
  X,
  XCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import type { ReviewAnswer } from "../review-data";

type SolutionsReviewProps = {
  attemptId: string;
  answers: ReviewAnswer[];
  testTitle: string;
};

function getResultBadge(resultState: ReviewAnswer["resultState"]) {
  switch (resultState) {
    case "correct":
      return {
        label: "Correct",
        className: "border border-emerald-200 bg-emerald-300 text-black",
        icon: <CheckCircle2 className="h-4 w-4" />,
      };
    case "wrong":
      return {
        label: "Wrong",
        className: "border border-red-200 bg-red-300 text-black",
        icon: <XCircle className="h-4 w-4" />,
      };
    case "unattempted":
    default:
      return {
        label: "Unattempted",
        className: "border border-slate-400 bg-slate-200 text-slate-800",
        icon: <Circle className="h-4 w-4" />,
      };
  }
}

function getPaletteTone(resultState: ReviewAnswer["resultState"], active: boolean) {
  switch (resultState) {
    case "correct":
      return active
        ? "scale-110 border-2 border-emerald-500 bg-emerald-300 text-black shadow-md shadow-emerald-200/70"
        : "border border-emerald-500 bg-emerald-300 text-black";
    case "wrong":
      return active
        ? "scale-110 border-2 border-red-500 bg-red-300 text-black shadow-md shadow-red-200/70"
        : "border border-red-500 bg-red-300 text-black";
    case "unattempted":
    default:
      return active
        ? "scale-110 border-2 border-slate-500 bg-slate-200 text-slate-800 shadow-md shadow-slate-200/70"
        : "border border-slate-400 bg-slate-200 text-slate-700";
  }
}

function getOptionTone(input: {
  isCorrect: boolean;
  isSelected: boolean;
}) {
  if (input.isCorrect) {
    return "border border-emerald-200 bg-emerald-300 text-black";
  }

  if (input.isSelected) {
    return "border border-red-200 bg-red-300 text-black";
  }

  return "border border-slate-200 bg-white text-slate-800";
}

export default function SolutionsReview({
  attemptId,
  answers,
  testTitle,
}: SolutionsReviewProps) {
  const supabase = useMemo(() => createClient(), []);
  const [activeQuestionId, setActiveQuestionId] = useState(
    answers[0]?.questions.id ?? "",
  );
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const paletteContainerRef = useRef<HTMLDivElement | null>(null);
  const paletteButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const reportToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reportingQuestionId, setReportingQuestionId] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportToast, setReportToast] = useState<string | null>(null);

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}m ${secs}s`;
  }

  function keepPaletteQuestionVisible(questionId: string) {
    const container = paletteContainerRef.current;
    const button = paletteButtonRefs.current[questionId];

    if (!container || !button) {
      return;
    }

    const targetTop =
      button.offsetTop - (container.clientHeight - button.offsetHeight) / 2;

    container.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: "smooth",
    });
  }

  function jumpToQuestion(questionId: string) {
    setActiveQuestionId(questionId);
    keepPaletteQuestionVisible(questionId);
    questionRefs.current[questionId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function openReportModal(questionId: string) {
    setReportingQuestionId(questionId);
    setReportTitle("");
    setReportDescription("");
    setReportError(null);
  }

  function resetReportModalState() {
    setReportingQuestionId(null);
    setReportTitle("");
    setReportDescription("");
    setReportError(null);
  }

  function closeReportModal() {
    if (reportSubmitting) {
      return;
    }

    resetReportModalState();
  }

  function showReportToast(message: string) {
    if (reportToastTimeoutRef.current) {
      clearTimeout(reportToastTimeoutRef.current);
    }

    setReportToast(message);
    reportToastTimeoutRef.current = setTimeout(() => {
      setReportToast(null);
      reportToastTimeoutRef.current = null;
    }, 3000);
  }

  async function handleReportSubmit() {
    const trimmedTitle = reportTitle.trim();
    const trimmedDescription = reportDescription.trim();

    if (!reportingQuestionId) {
      setReportError("Please choose a question before submitting a report.");
      return;
    }

    if (!trimmedTitle) {
      setReportError("Please add a short title for the issue.");
      return;
    }

    if (!trimmedDescription) {
      setReportError("Please add a short description so we can review it.");
      return;
    }

    setReportSubmitting(true);
    setReportError(null);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    const user = session?.user ?? null;

    if (sessionError || !user) {
      setReportSubmitting(false);
      setReportError("Please sign in again before submitting a report.");
      return;
    }

    const payload = {
      question_id: reportingQuestionId,
      reported_by: user.id,
      title: trimmedTitle,
      description: trimmedDescription,
    };

    const { data, error } = await supabase
      .from("question_reports")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data) {
      console.error("Failed to submit question report:", {
        error,
        payload,
        userId: user.id,
      });
      setReportSubmitting(false);
      setReportError(
        error?.message || "Could not submit the report right now. Please try again.",
      );
      return;
    }

    setReportSubmitting(false);
    resetReportModalState();
    showReportToast("Question reported successfully.");
  }

  useEffect(() => {
    return () => {
      if (reportToastTimeoutRef.current) {
        clearTimeout(reportToastTimeoutRef.current);
      }
    };
  }, []);

  if (answers.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
        No solutions are available for this attempt.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 md:pb-32 xl:pb-0">
      <div className="flex flex-col gap-4 rounded-3xl bg-white px-6 py-6 shadow-xl shadow-slate-200/50 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href={`/attempts/${attemptId}/result`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Result
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Solutions Review
          </h1>
          <p className="mt-2 text-sm text-slate-500">{testTitle}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Overview
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {answers.length} questions available for review
          </p>
        </div>
      </div>

      <div className="xl:hidden">
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur supports-[backdrop-filter]:bg-white/85">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Question Palette
          </p>
          <div className="-my-2 overflow-x-auto py-2 scrollbar-hide">
            <div className="flex min-w-max items-center gap-2 px-1">
              {answers.map((answer, index) => (
                <button
                  key={answer.questions.id}
                  type="button"
                  onClick={() => jumpToQuestion(answer.questions.id)}
                  className={`inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-sm font-semibold transition ${getPaletteTone(
                    answer.resultState,
                    answer.questions.id === activeQuestionId,
                  )}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-6">
          {answers.map((answer, index) => {
            const badge = getResultBadge(answer.resultState);

            return (
              <div
                key={answer.questions.id}
                ref={(node) => {
                  questionRefs.current[answer.questions.id] = node;
                }}
                className={`rounded-3xl bg-white shadow-xl shadow-slate-200/50 transition ${
                  answer.questions.id === activeQuestionId ? "ring-2 ring-slate-900/10" : ""
                }`}
              >
                <div className="space-y-6 p-6 md:p-8">
                  <div className="space-y-4">
                    <div className="p-1">
                      <div className="flex flex-col gap-3">
                        <div className="sm:hidden">
                          <p className="w-fit rounded-full border bg-yellow-300 px-3 py-2 text-xs font-medium text-black">
                            Question {index + 1}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide sm:hidden">
                          <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800">
                            <Clock3 className="h-4 w-4 text-slate-500" />
                            {formatTime(answer.timeSpent)}
                          </div>

                          <div className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-medium ${badge.className}`}>
                            {badge.icon}
                            {badge.label}
                          </div>

                          <button
                            type="button"
                            onClick={() => openReportModal(answer.questions.id)}
                            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Flag className="h-4 w-4" />
                            Report
                          </button>
                        </div>

                        <div className="hidden sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                          <p className="w-fit rounded-full border bg-yellow-300 px-4 py-2 text-sm font-medium text-black">
                            Question {index + 1}
                          </p>

                          <div className="flex flex-row flex-wrap items-center justify-end gap-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800">
                              <Clock3 className="h-4 w-4 text-slate-500" />
                              {formatTime(answer.timeSpent)}
                            </div>
                            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${badge.className}`}>
                              {badge.icon}
                              {badge.label}
                            </div>
                            <button
                              type="button"
                              onClick={() => openReportModal(answer.questions.id)}
                              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                            >
                              <Flag className="h-4 w-4" />
                              Report
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <h2 className="text-base font-medium leading-relaxed text-black md:text-lg">
                      {answer.questions.question_text}
                    </h2>
                  </div>

                  {answer.questions.question_image ? (
                    <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-slate-50">
                      <Image
                        src={answer.questions.question_image}
                        alt={`Question ${index + 1}`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 1024px) 100vw, 900px"
                      />
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Answer Options
                    </p>
                    <div className="space-y-3">
                      {answer.questions.options.map((option, optionIndex) => {
                        const isSelected = answer.selected_option?.id === option.id;

                        return (
                          <div
                            key={option.id}
                            className={`rounded-2xl px-4 py-2.5 ${getOptionTone({
                              isCorrect: option.is_correct,
                              isSelected,
                            })}`}
                          >
                            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/5 text-xs font-semibold">
                                  {String.fromCharCode(65 + optionIndex)}
                                </span>
                                <p className="min-w-0 text-sm font-medium leading-relaxed break-words">
                                  {option.option_text}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 self-center">
                                {option.is_correct || isSelected ? (
                                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white/40">
                                    {option.is_correct ? (
                                      <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                      <XCircle className="h-4 w-4" />
                                    )}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {answer.questions.solution ? (
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="mb-2 text-sm font-semibold text-slate-900">
                        Solution
                      </p>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                        {answer.questions.solution}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-6 rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/50">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Question Palette
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Jump directly to any question.
            </p>

            <div
              ref={paletteContainerRef}
              className="mt-5 max-h-[calc(100vh-12rem)] overflow-y-auto px-1 py-2 scrollbar-hide"
            >
              <div className="grid grid-cols-4 gap-3">
                {answers.map((answer, index) => (
                  <button
                    key={answer.questions.id}
                    type="button"
                    ref={(node) => {
                      paletteButtonRefs.current[answer.questions.id] = node;
                    }}
                    onClick={() => jumpToQuestion(answer.questions.id)}
                    className={`inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-sm font-semibold transition ${getPaletteTone(
                      answer.resultState,
                      answer.questions.id === activeQuestionId,
                    )}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {reportingQuestionId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-2xl shadow-slate-900/20 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Report Question
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                  Tell us what looks wrong
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Share what felt incorrect or unclear in this question so it can be reviewed properly.
                </p>
              </div>

              <button
                type="button"
                onClick={closeReportModal}
                disabled={reportSubmitting}
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close report modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="report-title"
                  className="text-sm font-medium text-slate-800"
                >
                  Title
                </label>
                <input
                  id="report-title"
                  type="text"
                  value={reportTitle}
                  onChange={(event) => setReportTitle(event.target.value)}
                  placeholder="Example: Correct option looks incorrect"
                  disabled={reportSubmitting}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="report-description"
                  className="text-sm font-medium text-slate-800"
                >
                  Description
                </label>
                <textarea
                  id="report-description"
                  value={reportDescription}
                  onChange={(event) => setReportDescription(event.target.value)}
                  placeholder="Explain what seems wrong, missing, or confusing in this question or solution."
                  rows={5}
                  disabled={reportSubmitting}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                />
              </div>
            </div>

            {reportError ? (
              <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {reportError}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeReportModal}
                disabled={reportSubmitting}
                className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleReportSubmit()}
                disabled={reportSubmitting}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                <Flag className="h-4 w-4" />
                {reportSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reportToast ? (
        <div className="fixed right-4 bottom-24 z-50 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg shadow-emerald-100 xl:bottom-6">
          {reportToast}
        </div>
      ) : null}
    </div>
  );
}
