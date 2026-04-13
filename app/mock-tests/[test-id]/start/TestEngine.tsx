"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SubmitModal from "./components/SummaryPanel";
import Loader from "@/app/components/ui/loader";
import { useMockTestsNavigationLoader } from "../../MockTestsNavigationLoader";

interface Option {
  id: string;
  option_text: string;
}

interface Question {
  id: string;
  question_text: string;
  question_order: number;
  question_image?: string | null;
  options: Option[];
}

interface Props {
  questions: Question[];
  attemptId: string;
  durationMinutes: number;
}

export default function TestEngine({
  questions,
  attemptId,
  durationMinutes,
}: Props) {
  const router = useRouter();
  const { hideLoader } = useMockTestsNavigationLoader();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [markedReview, setMarkedReview] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isAutoSubmitFlow, setIsAutoSubmitFlow] = useState(false);
  const [questionTime, setQuestionTime] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem(`analytics-${attemptId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [startTime, setStartTime] = useState<number>(() => Date.now());
  const answersRef = useRef(answers);
  const questionTimeRef = useRef(questionTime);
  const currentIndexRef = useRef(currentIndex);
  const startTimeRef = useRef(startTime);
  const submittingRef = useRef(submitting);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    questionTimeRef.current = questionTime;
  }, [questionTime]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  useEffect(() => {
    hideLoader();
  }, [hideLoader]);

  useEffect(() => {
    const nextQ = questions[currentIndex + 1];
    if (nextQ?.question_image) {
      const img = new Image();
      img.src = nextQ.question_image;
    }
  }, [currentIndex, questions]);

  async function handleSubmit() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const finalQuestion = questions[currentIndexRef.current];
      const now = Date.now();
      const timeSpent = Math.floor((now - startTimeRef.current) / 1000);
      const currentAnswers = answersRef.current;
      const currentQuestionTime = questionTimeRef.current;

      const finalTime = {
        ...currentQuestionTime,
        [finalQuestion.id]: (currentQuestionTime[finalQuestion.id] || 0) + timeSpent,
      };

      const res = await fetch("/api/submit-test", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          answers: currentAnswers,
          analytics: finalTime,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = data?.error || "Failed to submit test";
        setSubmitError(message);

        if (data?.error === "Test already submitted") {
          router.push(`/attempts/${attemptId}/result`);
          return;
        }

        setIsAutoSubmitFlow(false);
        submittingRef.current = false;
        setSubmitting(false);
        return;
      }

      router.push(`/attempts/${attemptId}/result`);
    } catch (error) {
      console.error("Submit failed:", error);
      setSubmitError("Something went wrong while submitting. Please try again.");
      submittingRef.current = false;
      setSubmitting(false);
      setIsAutoSubmitFlow(false);
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowSubmitModal(true);
          setIsAutoSubmitFlow(true);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!showSubmitModal || !isAutoSubmitFlow || submittingRef.current) {
      return;
    }

    void handleSubmit();
  }, [isAutoSubmitFlow, showSubmitModal]);

  function formatTime(seconds: number) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const pad = (num: number) => num.toString().padStart(2, "0");

    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    history.pushState(null, "", location.href);

    const handlePopState = () => {
      window.removeEventListener("popstate", handlePopState);
      router.replace("/mock-tests");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(`analytics-${attemptId}`, JSON.stringify(questionTime));
    }, 500);

    return () => clearTimeout(timeout);
  }, [attemptId, questionTime]);

  async function selectOption(optionId: string) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));

    try {
      fetch("/api/save-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          questionId: currentQuestion.id,
          optionId,
        }),
      });
    } catch (error) {
      console.error("Autosave failed:", error);
    }
  }

  function goToQuestion(index: number) {
    const now = Date.now();
    const activeQuestion = questions[currentIndex];
    const timeSpent = Math.floor((now - startTime) / 1000);

    setQuestionTime((prev) => ({
      ...prev,
      [activeQuestion.id]: (prev[activeQuestion.id] || 0) + timeSpent,
    }));

    setStartTime(now);
    setVisited((prev) => ({ ...prev, [activeQuestion.id]: true }));
    setCurrentIndex(index);
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      goToQuestion(currentIndex + 1);
    }
  }

  function toggleMarkForReview() {
    setMarkedReview((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  }

  function clearResponse() {
    setAnswers((prev) => {
      const updated = { ...prev };
      delete updated[currentQuestion.id];
      return updated;
    });
  }

  function handleSaveAndNext() {
    handleNext();
  }

  function handleSaveAndMarkForReview() {
    toggleMarkForReview();
    handleNext();
  }

  function handleMarkForReviewAndNext() {
    toggleMarkForReview();
    handleNext();
  }

  function openSubmitModal() {
    if (submitting) return;
    setShowSubmitModal(true);
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
      {submitting && !isAutoSubmitFlow && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 px-4 backdrop-blur-[2px]">
          <Loader
            title="Submitting your test"
            subtitle="Saving your answers and score."
          />
        </div>
      )}

      <div className="relative z-10 min-w-0 flex-1">
        <div className="min-h-[70vh] rounded-xl bg-white p-4 pb-72 shadow-sm sm:pb-44 md:min-h-screen md:p-12 md:pb-48">
          <h1 className="mb-6 border-b pb-2 text-lg font-semibold">
            Question{" "}
            <span className="inline-flex w-12 justify-center tabular-nums">
              {currentIndex + 1}
            </span>
            {" "}of{" "}
            <span className="inline-flex w-12 justify-center tabular-nums">
              {questions.length}
            </span>
          </h1>

          <div className="mb-2 border-b pb-4">
            <p className="break-words whitespace-pre-wrap text-sm sm:text-xl">
              {currentQuestion.question_text}
            </p>

            {currentQuestion.question_image && (
              <div className="mt-4 flex justify-center">
                <img
                  src={currentQuestion.question_image}
                  alt="Question illustration"
                  loading="lazy"
                  decoding="async"
                  className="max-h-96 w-auto object-contain"
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const checked = answers[currentQuestion.id] === option.id;

              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-center gap-3 break-words transition sm:p-3 ${
                    checked ? "bg-white" : "rounded-2xl hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    checked={checked}
                    onChange={() => selectOption(option.id)}
                    className="accent-blue-500"
                  />
                  <span className="text-sm leading-relaxed sm:text-lg">
                    {option.option_text}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 z-30 border-t border-neutral-200 bg-white/95 backdrop-blur-sm md:right-[25rem]">
          <div className="px-4 py-3 md:px-6 md:py-4">
            {submitError ? (
              <p className="mb-3 text-center text-sm text-red-600">{submitError}</p>
            ) : null}

            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-end">
              <button
                onClick={handleSaveAndMarkForReview}
                disabled={submitting}
                className="w-full rounded bg-amber-500 px-4 py-4 text-xs text-white disabled:cursor-not-allowed disabled:bg-amber-300 sm:w-auto sm:text-[16px]"
              >
                Save & Mark for Review
              </button>

              <button
                onClick={handleMarkForReviewAndNext}
                disabled={submitting}
                className="w-full rounded bg-blue-500 px-4 py-4 text-xs text-white disabled:cursor-not-allowed disabled:bg-blue-300 sm:w-auto sm:text-[16px]"
              >
                Marked for Review & Next
              </button>

              <button
                onClick={clearResponse}
                disabled={submitting}
                className="w-full rounded border border-black bg-white px-8 py-4 text-xs text-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:text-[16px]"
              >
                Clear
              </button>

              {currentIndex === questions.length - 1 ? (
                <button
                  onClick={openSubmitModal}
                  disabled={submitting}
                  className="w-full rounded bg-emerald-500 px-6 py-4 text-xs text-white disabled:cursor-not-allowed disabled:bg-emerald-300 sm:w-auto sm:text-[16px]"
                >
                  Save & Submit
                </button>
              ) : (
                <button
                  onClick={handleSaveAndNext}
                  disabled={submitting}
                  className="w-full rounded bg-green-500 px-4 py-4 text-xs text-white disabled:cursor-not-allowed disabled:bg-green-300 sm:w-auto sm:text-[16px]"
                >
                  Save & Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <SubmitModal
        open={showSubmitModal}
        onClose={() => {
          if (!submitting && !isAutoSubmitFlow) {
            setShowSubmitModal(false);
          }
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
        autoSubmitting={isAutoSubmitFlow}
        total={questions.length}
        answered={Object.keys(answers).length}
        notAnswered={questions.length - Object.keys(answers).length}
        marked={Object.values(markedReview).filter(Boolean).length}
        answeredAndMarked={questions.filter(
          (question) => answers[question.id] && markedReview[question.id]
        ).length}
      />

      <div className="order-first relative z-10 flex w-full flex-col border-b bg-white md:order-last md:h-screen md:w-[25rem] md:sticky md:top-0 md:border-b-0 md:border-l md:overflow-hidden">
        <div className="border-b border-neutral-200 px-4 py-4 md:px-6 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-base font-bold text-black md:text-lg">
              Remaining Time :
              <span className="rounded-full bg-cyan-500 px-4 py-1.5 text-sm text-white md:px-6 md:py-2 md:text-base">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 px-4 py-4 md:overflow-y-auto md:px-6 md:py-6">
          <div className="-mx-4 overflow-x-auto px-4 pb-4 scrollbar-hide md:hidden">
            <div className="flex min-w-max gap-2">
              {questions.map((question, index) => {
                const isAnswered = !!answers[question.id];
                const isMarked = !!markedReview[question.id];
                const isCurrent = index === currentIndex;

                return (
                  <button
                    key={question.id}
                    onClick={() => goToQuestion(index)}
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center text-sm font-medium ${
                      isCurrent
                        ? "rounded-full bg-neutral-200 text-black ring-2 ring-neutral-400"
                        : isMarked
                          ? "rounded-full bg-purple-500 text-white"
                          : isAnswered
                            ? "rounded-t-full bg-green-500 text-white"
                            : visited[question.id]
                              ? "rounded-t-full bg-red-400 text-white"
                              : "rounded-xl border border-neutral-300 bg-neutral-50 text-black"
                    }`}
                  >
                    <span className="relative flex h-full w-full items-center justify-center">
                      {index + 1}
                      {isMarked && isAnswered && (
                        <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden grid-cols-5 gap-2 md:grid">
            {questions.map((question, index) => {
              const isAnswered = !!answers[question.id];
              const isMarked = !!markedReview[question.id];
              const isCurrent = index === currentIndex;

              return (
                <button
                  key={question.id}
                  onClick={() => goToQuestion(index)}
                  className={`flex h-14 w-14 items-center justify-center text-sm font-medium ${
                    isCurrent
                      ? "rounded-full bg-neutral-200 text-black"
                      : isMarked
                        ? "rounded-full bg-purple-500 text-white"
                        : isAnswered
                          ? "rounded-t-full bg-green-500 text-white"
                          : visited[question.id]
                            ? "rounded-t-full bg-red-400 text-white"
                            : "rounded-xl border border-neutral-300 bg-neutral-50 text-black"
                  }`}
                >
                  <span className="relative flex h-full w-full items-center justify-center tabular-nums">
                    {index + 1}
                    {isMarked && isAnswered && (
                      <span className="absolute -bottom-3 -right-3 h-4 w-4 rounded-full bg-green-500" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-neutral-200 px-4 py-3 md:px-6 md:py-4">
          <button
            type="button"
            onClick={openSubmitModal}
            disabled={submitting}
            className="block w-full rounded bg-neutral-900 px-4 py-4 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400 sm:text-[16px]"
          >
            Submit Test
          </button>
        </div>
      </div>
    </div>
  );
}
