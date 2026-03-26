import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { attemptId, answers, analytics } = await req.json();

    if (!attemptId || !answers || !analytics) {
      return NextResponse.json(
        { error: "Missing attemptId or answers or analytics" },
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

    // 🔥 NEW: Use RPC to handle scoring + answers + attempt update
    const { error: rpcError } = await supabase.rpc("submit_test", {
      attempt_id: attemptId,
      answers_json: answers,
    });

    if (rpcError) {
      console.error("RPC submit_test error:", rpcError);
      return NextResponse.json(
        { error: rpcError.message || "Could not submit test" },
        { status: 500 }
      );
    }

    // Build analytics (without is_correct, handled in DB)
    const analyticsToInsert: any[] = [];

    for (const questionId in answers) {
      const timeSpent = Math.max(0, analytics[questionId] ?? 0);

      analyticsToInsert.push({
        attempt_id: attemptId,
        user_id: user.id,
        test_id: attempt.test_id,
        question_id: questionId,
        time_spent: timeSpent,
        is_correct: null,
      });
    }

    // Insert analytics (RAW) with upsert to prevent duplicates
    if (analyticsToInsert.length > 0) {
      const { error: analyticsError } = await supabase
        .from("question_analytics")
        .upsert(analyticsToInsert, {
          onConflict: "attempt_id,question_id",
        });

      if (analyticsError) {
        console.error("Analytics upsert error:", analyticsError);
      }
    }

    // Update analytics summary (BATCH UPSERT - optimized)
    if (analyticsToInsert.length > 0) {
      const { error: summaryError } = await supabase.rpc(
        "upsert_question_summary_batch",
        {
          analytics_data: analyticsToInsert,
        }
      );

      if (summaryError) {
        console.error("Summary batch upsert error:", summaryError);
      }
    }

    return NextResponse.json({
      success: true,
      score: null,
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