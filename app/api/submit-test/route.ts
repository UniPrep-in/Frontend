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
              cookieStore.set(name, value, options)
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

    // Fetch all questions for this test
    const { data: questions } = await supabase
      .from("questions")
      .select("id, marks, negative_marks")
      .eq("test_id", attempt.test_id);

    if (!questions) {
      return NextResponse.json(
        { error: "Questions not found" },
        { status: 404 }
      );
    }

    // Fetch correct options
    const questionIds = questions.map((q) => q.id);

    const { data: correctOptions } = await supabase
      .from("options")
      .select("id, question_id")
      .eq("is_correct", true)
      .in("question_id", questionIds);

    if (!correctOptions) {
      return NextResponse.json(
        { error: "Correct options not found" },
        { status: 404 }
      );
    }

    // Map correct answers
    const correctMap: Record<string, string> = {};
    correctOptions.forEach((opt) => {
      correctMap[opt.question_id] = opt.id;
    });

    let score = 0;
    const userAnswersToInsert: any[] = [];

    for (const question of questions) {
      const selectedOptionId = answers[question.id];

      if (!selectedOptionId) continue; // unanswered

      const isCorrect =
        correctMap[question.id] &&
        correctMap[question.id] === selectedOptionId;

      if (isCorrect) {
        score += question.marks;
      } else {
        score -= question.negative_marks ?? 0;
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
      await supabase.from("user_answers").insert(userAnswersToInsert);
    }

    // Update attempt score
    await supabase
      .from("test_attempts")
      .update({
        score,
        completed_at: new Date().toISOString(),
      })
      .eq("id", attemptId);

    return NextResponse.json({
      success: true,
      score,
    });
  } catch (error) {
    console.error("Submit test error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}