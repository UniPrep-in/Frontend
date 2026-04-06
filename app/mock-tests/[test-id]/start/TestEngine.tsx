"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SubmitModal from "./components/SummaryPanel";

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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [markedReview, setMarkedReview] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
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

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    const nextQ = questions[currentIndex + 1];
    if (nextQ?.question_image) {
      const img = new Image();
      img.src = nextQ.question_image;
    }
  }, [currentIndex, questions]);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const finalQ = questions[currentIndex];
      const now = Date.now();
      const timeSpent = Math.floor((now - startTime) / 1000);

      const finalTime = {
        ...questionTime,
        [finalQ.id]: (questionTime[finalQ.id] || 0) + timeSpent,
      };

      const res = await fetch("/api/submit-test", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, answers, analytics: finalTime }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = data?.error || "Failed to submit test";
        setSubmitError(message);
        if (data?.error === "Test already submitted") {
          router.push(`/attempts/${attemptId}/result`);
          return;
        }
        setSubmitting(false);
        return;
      }

      router.push(`/attempts/${attemptId}/result`);
    } catch (error) {
      console.error("Submit failed:", error);
      setSubmitError("Something went wrong while submitting. Please try again.");
      setSubmitting(false);
    }
  }

  /* ---------------- Timer ---------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function formatTime(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (num: number) => num.toString().padStart(2, "0");

  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

  /* ---------------- Prevent Exit ---------------- */
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
      localStorage.setItem(
        `analytics-${attemptId}`,
        JSON.stringify(questionTime)
      );
    }, 500);

    return () => clearTimeout(timeout);
  }, [questionTime]);


  /* ---------------- Answer Handling ---------------- */
  async function selectOption(optionId: string) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
    try {
      fetch("/api/save-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, questionId: currentQuestion.id, optionId }),
      });
    } catch (error) {
      console.error("Autosave failed:", error);
    }
  }

  function goToQuestion(index: number) {
    const now = Date.now();
    const currentQ = questions[currentIndex];

    const timeSpent = Math.floor((now - startTime) / 1000);

    setQuestionTime((prev) => ({
      ...prev,
      [currentQ.id]: (prev[currentQ.id] || 0) + timeSpent,
    }));

    setStartTime(now);
    setVisited((prev) => ({ ...prev, [currentQ.id]: true }));
    setCurrentIndex(index);
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) goToQuestion(currentIndex + 1);
  }

  function handlePrevious() {
    if (currentIndex > 0) goToQuestion(currentIndex - 1);
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

  /* ---------------- UI ---------------- */

  return (
    <div className="flex flex-col md:flex-row bg-gray-50 min-h-screen">
      {/* Submit full-screen loader */}
      {submitting && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[2px]">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
          <p className="mt-4 text-gray-600 font-medium">Submitting your test...</p>
          <p className="text-sm text-gray-500">Please wait</p>
        </div>
      )}

      {/* Main Section — grows naturally, page scrolls */}
      <div className="flex-1 min-w-0 relative z-10">
        <div className="bg-white p-4 md:p-12 rounded-xl shadow-sm">
          <h1 className="text-lg font-semibold border-b pb-2 mb-6">
            Question {currentIndex + 1} of {questions.length}
          </h1>

          <div className="border-b pb-4 mb-2">
            <p className="sm:text-xl text-sm break-words whitespace-pre-wrap">
              {currentQuestion.question_text}
            </p>

            {/* URL stored in DB is the full Supabase public URL — use directly */}
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
                  className={`flex items-center gap-3 sm:p-3 cursor-pointer transition break-words ${
                    checked ? "bg-white" : "hover:bg-gray-50 rounded-2xl"
                  }`}
                >
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    checked={checked}
                    onChange={() => selectOption(option.id)}
                    className="accent-blue-500"
                  />
                  <span className="sm:text-lg text-sm leading-relaxed">{option.option_text}</span>
                </label>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
            {currentIndex === questions.length - 1 ? (
              <button
                onClick={() => setShowSubmitModal(true)}
                disabled={submitting}
                className="px-6 py-4 bg-emerald-500 text-white sm:text-[16px] text-xs rounded disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                Save & Submit
              </button>
            ) : (
              <button
                onClick={handleSaveAndNext}
                className="px-4 py-4 bg-green-500 text-white sm:text-[16px] text-xs rounded"
              >
                Save & Next
              </button>
            )}

            <button
              onClick={clearResponse}
              className="px-8 py-4 bg-white sm:text-[16px] text-xs border border-black text-black rounded"
            >
              Clear
            </button>

            <button
              onClick={handleSaveAndMarkForReview}
              className="px-4 py-4 bg-amber-500 sm:text-[16px] text-xs text-white rounded"
            >
              Save & Mark for Review
            </button>

            <button
              onClick={handleMarkForReviewAndNext}
              className="px-4 py-4 bg-blue-500 sm:text-[16px] text-xs text-white rounded"
            >
              Marked for Review & Next
            </button>
          </div>

          {submitError && (
            <p className="mt-4 text-red-600 text-sm text-center">{submitError}</p>
          )}
        </div>
      </div>

      <SubmitModal
        open={showSubmitModal}
        onClose={() => {
          if (!submitting) {
            setShowSubmitModal(false);
          }
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
        total={questions.length}
        answered={Object.keys(answers).length}
        notAnswered={questions.length - Object.keys(answers).length}
        marked={Object.values(markedReview).filter(Boolean).length}
        answeredAndMarked={questions.filter(
          (q) => answers[q.id] && markedReview[q.id]
        ).length}
      />

      {/* Right Palette — sticks to viewport while page scrolls */}
      <div className="w-full md:w-92 md:sticky md:top-0 md:h-screen flex flex-col justify-between bg-white md:border-l border-b p-4 md:p-6 pb-6 md:pb-12 overflow-y-auto relative z-10 order-first md:order-last">
  <div className="min-w-0">
    {/* Header - Stays visible */}
    <div className="flex justify-between items-center mb-4 md:mb-6">
      <div className="text-black flex items-center gap-2 font-bold text-base md:text-lg">
        Remaining Time :
        <span className="bg-cyan-500 text-white px-4 md:px-6 py-1.5 md:py-2 rounded-full text-sm md:text-base">
          {formatTime(timeLeft)}
        </span>
      </div>
    </div>

    {/* Mobile: Horizontal scroll container */}
    <div className="md:hidden -mx-4 px-4 overflow-x-auto pb-4 scrollbar-hide">
      <div className="flex gap-2 min-w-max">
        {questions.map((q, index) => {
          const isAnswered = !!answers[q.id];
          const isMarked = !!markedReview[q.id];
          const isCurrent = index === currentIndex;

          return (
              <button
                key={q.id}
                onClick={() => goToQuestion(index)}
                className={`flex-shrink-0 w-12 h-12 text-sm font-medium flex items-center justify-center ${
                  isCurrent
                    ? "bg-neutral-200 text-black rounded-full ring-2 ring-neutral-400"
                    : isMarked
                      ? "bg-purple-500 text-white rounded-full"
                      : isAnswered
                        ? "bg-green-500 text-white rounded-t-full"
                        : visited[q.id]
                          ? "bg-red-400 text-white rounded-t-full"
                          : "bg-neutral-50 text-black border rounded-xl border-neutral-300"
                }`}
              >
                <span className="relative flex items-center justify-center w-full h-full">
                  {index + 1}
                  {isMarked && isAnswered && (
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

    {/* Desktop: Grid layout */}
    <div className="hidden md:grid grid-cols-5 gap-2">
      {questions.map((q, index) => {
        const isAnswered = !!answers[q.id];
        const isMarked = !!markedReview[q.id];
        const isCurrent = index === currentIndex;

        return (
          <button
            key={q.id}
            onClick={() => goToQuestion(index)}
            className={`p-4 text-sm font-medium ${
              isCurrent
                ? "bg-neutral-200 text-black rounded-full"
                : isMarked
                  ? "bg-purple-500 text-white rounded-full"
                  : isAnswered
                    ? "bg-green-500 text-white rounded-t-full"
                    : visited[q.id]
                      ? "bg-red-400 text-white rounded-t-full"
                      : "bg-neutral-50 text-black border rounded-xl border-neutral-300"
            }`}
          >
            <span className="relative flex items-center justify-center">
              {index + 1}
              {isMarked && isAnswered && (
                <span className="absolute -bottom-3 -right-3 w-4 h-4 bg-green-500 rounded-full" />
              )}
            </span>
          </button>
        );
      })}
    </div>
  </div>
</div>
    </div>
  );
}

