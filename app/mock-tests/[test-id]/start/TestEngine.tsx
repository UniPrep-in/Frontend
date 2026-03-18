"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  const [questionTime, setQuestionTime] = useState<Record<string, number>>({});
  const [startTime, setStartTime] = useState<number>(() => Date.now());

  const currentQuestion = questions[currentIndex];

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
    const handlePopState = () => history.pushState(null, "", location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      `analytics-${attemptId}`,
      JSON.stringify(questionTime)
    );
  }, [questionTime]);

  useEffect(() => {
    const saved = localStorage.getItem(`analytics-${attemptId}`);
    if (saved) {
      setQuestionTime(JSON.parse(saved));
    }
  }, []);

  /* ---------------- Answer Handling ---------------- */
  async function selectOption(optionId: string) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
    try {
      await fetch("/api/save-answer", {
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

  /* ---------------- UI ---------------- */

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Submit full-screen loader */}
      {submitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
          <p className="mt-4 text-gray-600 font-medium">Submitting your test…</p>
          <p className="text-sm text-gray-500">Please wait</p>
        </div>
      )}

      {/* Main Section — grows naturally, page scrolls */}
      <div className="flex-1 min-w-0">
        <div className="bg-white p-12 rounded-xl shadow-sm">
          <h1 className="text-lg font-semibold border-b pb-2 mb-6">
            Question {currentIndex + 1} of {questions.length}
          </h1>

          <div className="border-b pb-4 mb-2">
            <p className="text-xl break-words whitespace-pre-wrap">
              {currentQuestion.question_text}
            </p>

            {/* URL stored in DB is the full Supabase public URL — use directly */}
            {currentQuestion.question_image && (
              <div className="mt-4 flex justify-center">
                <img
                  src={currentQuestion.question_image}
                  alt="Question illustration"
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
                  className={`flex items-center gap-3 p-3 cursor-pointer transition break-words ${
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
                  <span className="text-lg leading-relaxed">{option.option_text}</span>
                </label>
              );
            })}
          </div>

          {submitError && (
            <p className="mt-4 text-red-600 text-sm text-center">{submitError}</p>
          )}
        </div>
      </div>

      {/* Right Palette — sticks to viewport while page scrolls */}
      <div className="w-92 sticky top-0 h-screen flex flex-col justify-between bg-white border-l p-6 pb-12 overflow-y-auto">
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="text-black flex items-center gap-2 font-bold text-lg">
              Remaining Time :
              <span className="bg-cyan-500 text-white px-6 py-2 rounded-full">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, index) => {
              const isAnswered = !!answers[q.id];
              const isMarked = !!markedReview[q.id];
              const isCurrent = index === currentIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(index)}
                  className={`p-3 text-lg font-medium ${
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

            <div className="py-8">
              <button
            onClick={toggleMarkForReview}
            className={`px-6 py-4 rounded-xl font-medium ${
              markedReview[currentQuestion.id]
                ? "bg-green-500 text-white"
                : "bg-purple-500 text-white"
            }`}
          >
            {markedReview[currentQuestion.id] ? "Marked for Review" : "Mark for Review"}
          </button>
            </div>
        </div>

        <div className="flex justify-between items-center mt-8 gap-3 flex-wrap">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-6 py-2 bg-linear-to-br from-neutral-300 via-neutral-100 to-neutral-300 shadow-lg text-black border rounded-xl disabled:opacity-50"
          >
            {"<<"} Previous
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-emerald-300 text-black border hover:scale-110 duration-300 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting…" : "Submit Test"}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-linear-to-br from-neutral-300 via-neutral-100 to-neutral-300 shadow-lg text-black border rounded-xl"
            >
              Next {">>"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}