import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type ReviewOption = {
  id: string;
  option_text: string;
  is_correct: boolean;
};

type ReviewQuestionRow = {
  id: string;
  question_text: string;
  question_order: number;
  question_image: string | null;
  solution: string | null;
  options: ReviewOption[] | null;
  user_answers:
    | {
        id: string;
        is_correct: boolean | null;
        selected_option:
          | {
              id: string;
              option_text: string;
            }
          | null;
      }[]
    | null;
};

export type ReviewAnswer = {
  id: string;
  resultState: "correct" | "wrong" | "unattempted";
  is_correct: boolean | null;
  timeSpent: number;
  selected_option: {
    id: string;
    option_text: string;
  } | null;
  questions: {
    id: string;
    question_text: string;
    question_order: number;
    question_image: string | null;
    solution: string | null;
    options: ReviewOption[];
  };
};

export type TimingEntry = {
  questionId: string;
  questionOrder: number;
  timeSpent: number;
};

type AnalyticsRow = {
  question_id: string;
  time_spent: number | null;
};

export type AttemptReviewData = {
  attemptId: string;
  testId: string;
  testTitle: string;
  score: number | null;
  totalQuestions: number;
  totalAttempted: number;
  correct: number;
  wrong: number;
  unattempted: number;
  totalMarks: number;
  accuracy: number;
  totalTime: number;
  solutionAnswers: ReviewAnswer[];
  timingEntries: TimingEntry[];
};

function getResultState(answer: {
  selected_option: { id: string; option_text: string } | null;
  is_correct: boolean | null;
}): ReviewAnswer["resultState"] {
  if (!answer.selected_option) {
    return "unattempted";
  }

  return answer.is_correct ? "correct" : "wrong";
}

export async function getAttemptReviewData(
  attemptId: string,
): Promise<AttemptReviewData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: attempt } = await supabase
    .from("test_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single();

  if (!attempt) {
    redirect("/mock-tests");
  }

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

  const { data: questionsWithAnswers } = await supabase
    .from("questions")
    .select(`
      id,
      question_text,
      question_order,
      question_image,
      solution,
      options (
        id,
        option_text,
        is_correct
      ),
      user_answers (
        id,
        is_correct,
        selected_option:options!user_answers_selected_option_id_fkey (
          id,
          option_text
        )
      )
    `)
    .eq("test_id", attempt.test_id)
    .eq("user_answers.attempt_id", attemptId)
    .order("question_order", { ascending: true });

  const solutionAnswers =
    ((questionsWithAnswers ?? []) as ReviewQuestionRow[]).map((question) => {
      const answer = question.user_answers?.[0] ?? null;
      const normalizedAnswer = {
        id: answer?.id ?? question.id,
        is_correct: answer?.is_correct ?? null,
        selected_option: answer?.selected_option ?? null,
      };
      const questionTimeSpent =
        (analytics as AnalyticsRow[] | null)?.find((entry) => entry.question_id === question.id)
          ?.time_spent || 0;

      return {
        ...normalizedAnswer,
        resultState: getResultState(normalizedAnswer),
        timeSpent: questionTimeSpent,
        questions: {
          id: question.id,
          question_text: question.question_text,
          question_order: question.question_order,
          question_image: question.question_image,
          solution: question.solution,
          options: question.options ?? [],
        },
      };
    });

  const questionOrderById = new Map(
    solutionAnswers.map((answer) => [answer.questions.id, answer.questions.question_order]),
  );

  const timingEntries = ((analytics ?? []) as AnalyticsRow[])
    .map((entry) => {
      const questionOrder = questionOrderById.get(entry.question_id);

      if (questionOrder == null) {
        return null;
      }

      return {
        questionId: entry.question_id,
        questionOrder,
        timeSpent: entry.time_spent || 0,
      };
    })
    .filter((entry): entry is TimingEntry => entry !== null)
    .sort((a, b) => a.questionOrder - b.questionOrder);

  const totalAttempted = answers?.length ?? 0;
  const correct = answers?.filter((answer) => answer.is_correct).length ?? 0;
  const wrong = totalAttempted - correct;
  const totalQuestions = totalInTest ?? solutionAnswers.length;
  const unattempted = Math.max(0, totalQuestions - totalAttempted);
  const totalMarks = Math.imul(totalQuestions, 5);
  const accuracy =
    totalAttempted > 0
      ? Math.round((correct / totalAttempted) * 100)
      : 0;
  const totalTime = timingEntries.reduce((sum, entry) => sum + entry.timeSpent, 0);

  return {
    attemptId,
    testId: attempt.test_id,
    testTitle,
    score: attempt.score ?? null,
    totalQuestions,
    totalAttempted,
    correct,
    wrong,
    unattempted,
    totalMarks,
    accuracy,
    totalTime,
    solutionAnswers,
    timingEntries,
  };
}
