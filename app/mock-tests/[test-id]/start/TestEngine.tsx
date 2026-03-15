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
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/submit-test", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attemptId,
          answers,
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
        setSubmitting(false);
        return;
      }

      // Keep full-screen loader visible until redirect
      router.push(`/attempts/${attemptId}/result`);
    } catch (error) {
      console.error("Submit failed:", error);
      setSubmitError(
        "Something went wrong while submitting. Please try again.",
      );
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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
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
      history.pushState(null, "", location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  /* ---------------- Answer Handling ---------------- */
  async function selectOption(optionId: string) {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));

    try {
      await fetch("/api/save-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
    setVisited((prev) => ({
      ...prev,
      [questions[currentIndex].id]: true,
    }));
    setCurrentIndex(index);
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      goToQuestion(currentIndex + 1);
    }
  }

  function handlePrevious() {
    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1);
    }
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Submit full-screen loader */}
      {submitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
          <p className="mt-4 text-gray-600 font-medium">
            Submitting your test…
          </p>
          <p className="text-sm text-gray-500">Please wait</p>
        </div>
      )}

      {/* Main Section — grows naturally, page scrolls */}
      <div className="flex-1 min-w-0">
        <div className="bg-white p-12 rounded-xl shadow-sm">
          <h1 className="text-lg font-semibold border-b pb-2 mb-6">
            Question {currentIndex + 1} of {questions.length}
          </h1>

          <p className="text-xl mb-2 wrap-break-words border-b pb-4 whitespace-pre-wrap">
            {currentQuestion.question_text}
          </p>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const checked = answers[currentQuestion.id] === option.id;

              return (
                <label
                  key={option.id}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition break-words ${
                    checked
                      ? "bg-white"
                      : "hover:bg-gray-50 rounded-2xl"
                  }`}
                >
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    checked={checked}
                    onChange={() => selectOption(option.id)}
                    className="accent-blue-500"
                  />

                  <span className="text-lg leading-relaxed">
                    {option.option_text}
                  </span>
                </label>
              );
            })}
          </div>

          {submitError && (
            <p className="mt-4 text-red-600 text-sm text-center">
              {submitError}
            </p>
          )}
        </div>
      </div>

      {/* Right Palette — sticks to viewport while page scrolls */}
      <div className="w-92 sticky top-0 h-screen flex flex-col justify-between bg-white border-l p-6 pb-12 overflow-y-auto">
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="text-black flex items-center gap-2 font-bold text-lg">
              Remaining Time :
              <span className="bg-cyan-500 text-white px-6 py-2 rounded-full">00:{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, index) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = index === currentIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`p-3 rounded-full text-lg font-medium ${
                    isCurrent
                      ? "bg-red-300 text-black border"
                      : isAnswered
                        ? "bg-emerald-300 border text-black"
                        : visited[q.id]
                          ? "bg-yellow-300 text-black border"
                          : "bg-neutral-100 text-black border"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-6 py-2 bg-linear-to-br from-neutral-300 via-neutral-100 to-neutral-300 shadow-lg text-black border rounded-xl"
          >
            {"<<"} Previous
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-black text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
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