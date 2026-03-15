import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { attemptId, answers } = await req.json();

    if (!attemptId || !answers) {
      return NextResponse.json(
        { error: "Missing attemptId or answers" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set({ name, value, ...options })
            );
          },
        },
      }
    );

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate attempt belongs to user
    const { data: attempt } = await supabase
      .from("test_attempts")
      .select("*")
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .single();

    if (!attempt) {
      return NextResponse.json(
        { error: "Invalid attempt" },
        { status: 403 }
      );
    }

    // Prevent double submission
    if (attempt.completed_at) {
      return NextResponse.json(
        { error: "Test already submitted" },
        { status: 400 }
      );
    }

    // Fetch all questions for this test (id only - marks/negative_marks may not exist in DB)
    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select("id")
      .eq("test_id", attempt.test_id);

    const questions = Array.isArray(questionsData) ? questionsData : [];
    if (questions.length === 0 && questionsError) {
      console.error("Submit test questions error:", questionsError);
    }

    // Fetch correct options (only if we have questions)
    let correctMap: Record<string, string> = {};
    if (questions.length > 0) {
      const questionIds = questions.map((q) => q.id);
      const { data: correctOptions, error: optionsError } = await supabase
        .from("options")
        .select("id, question_id")
        .eq("is_correct", true)
        .in("question_id", questionIds);

      if (optionsError) {
        console.error("Submit test options error:", optionsError);
      }
      if (Array.isArray(correctOptions)) {
        correctOptions.forEach((opt) => {
          correctMap[opt.question_id] = opt.id;
        });
      }
    }

    let score = 0;
    const userAnswersToInsert: any[] = [];

    for (const question of questions) {
      const selectedOptionId = answers[question.id];

      if (!selectedOptionId) continue; // unanswered

      const isCorrect =
        correctMap[question.id] &&
        correctMap[question.id] === selectedOptionId;

      const marks = (question as { marks?: number }).marks ?? 1;
      const negativeMarks = (question as { negative_marks?: number }).negative_marks ?? 0;
      if (isCorrect) {
        score += marks;
      } else {
        score -= negativeMarks;
      }

      userAnswersToInsert.push({
        attempt_id: attemptId,
        question_id: question.id,
        selected_option_id: selectedOptionId,
        is_correct: isCorrect,
      });
    }

    // Insert user answers
    if (userAnswersToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("user_answers")
        .insert(userAnswersToInsert);
      if (insertError) {
        console.error("Submit test insert error:", insertError);
        return NextResponse.json(
          { error: insertError.message || "Could not save answers" },
          { status: 500 }
        );
      }
    }

    // Update attempt score
    const { error: updateError } = await supabase
      .from("test_attempts")
      .update({
        score,
        completed_at: new Date().toISOString(),
      })
      .eq("id", attemptId);

    if (updateError) {
      console.error("Submit test update error:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Could not finalize result" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      score,
    });
  } catch (error) {
    console.error("Submit test error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}