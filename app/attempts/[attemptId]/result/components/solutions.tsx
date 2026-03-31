"use client";
import Image from "next/image";
import { memo, useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

type Option = {
  id: string;
  option_text: string;
  is_correct: boolean;
};

type Question = {
  id: string;
  question_text: string;
  question_order: number;
  question_image: string | null;
  solution: string | null;
  options: Option[];
};

type Answer = {
  id: string;
  is_correct: boolean | null;
  selected_option: {
    id: string;
    option_text: string;
  } | null;
  questions: Question;
};

type SolutionsProps = {
  answers: Answer[];
};

function Solutions({ answers }: SolutionsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;
  const formattedAnswers = useMemo(() => {
    return answers.map((answer) => {
      const correctOption = answer.questions?.options?.find(
        (option) => option.is_correct
      );

      return {
        ...answer,
        correctOption,
      };
    });
  }, [answers]);

  const totalPages = Math.ceil(formattedAnswers.length / questionsPerPage);

  const paginatedAnswers = useMemo(() => {
    const startIndex = (currentPage - 1) * questionsPerPage;
    return formattedAnswers.slice(startIndex, startIndex + questionsPerPage);
  }, [formattedAnswers, currentPage]);

  return (
    <div className="space-y-5">
      {paginatedAnswers.map((answer) => {
        if (!answer.questions) return null;

        return (
        <div
          key={answer.id}
          className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
        >
          <div className="space-y-5 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Question {answer.questions.question_order}
                </p>

                <h2 className="text-base font-medium leading-relaxed text-foreground">
                  {answer.questions.question_text}
                </h2>
              </div>

              {answer.selected_option == null ? (
                <div className="inline-flex w-fit items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <XCircle className="h-4 w-4" />
                  Not Attempted
                </div>
              ) : answer.is_correct ? (
                <div className="inline-flex w-fit items-center gap-1 rounded-full border border-green-200 bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Correct
                </div>
              ) : (
                <div className="inline-flex w-fit items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-sm font-medium text-white">
                  <XCircle className="h-4 w-4" />
                  Wrong
                </div>
              )}
            </div>

            {answer.questions.question_image && (
              <div className="relative h-64 w-full overflow-hidden rounded-xl border bg-muted">
                <Image
                  src={answer.questions.question_image}
                  alt={`Question ${answer.questions.question_order}`}
                  fill
                  priority={answer.questions.question_order <= 2}
                  loading={
                    answer.questions.question_order <= 2 ? "eager" : "lazy"
                  }
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Your Answer
                </p>
                <p className="text-sm font-medium text-foreground">
                  {answer.selected_option?.option_text || "Not Attempted"}
                </p>
              </div>

              <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
                  Correct Answer
                </p>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  {answer.correctOption?.option_text || "No correct answer found"}
                </p>
              </div>
            </div>

            {answer.questions.solution && (
              <div className="rounded-xl border bg-background p-4">
                <p className="mb-2 text-sm font-semibold text-foreground">
                  Solution
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {answer.questions.solution}
                </p>
              </div>
            )}
          </div>
        </div>
        );
      })}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  currentPage === page
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(Solutions);