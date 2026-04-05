import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProceedLoader from "./ProceedLoader";
import MockTestInstructionsContent, {
  PROCEED_CONFIRMATION_TEXT,
} from "./MockTestInstructionsContent";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLatestVerifiedSubscriptionAccess } from "@/lib/subscriptions";

export default async function TestInstructionsPage({
  params,
}: {
  params: Promise<{ "test-id": string }>;
}) {
  const resolvedParams = await params;
  const testId = resolvedParams["test-id"];

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // no-op
        },
      },
    },
  );

  // Get current session quickly from cookies for the instruction gate.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect("/auth");
  }

  const adminSupabase = createAdminClient();
  const [accessResult, testResult] = await Promise.all([
    getLatestVerifiedSubscriptionAccess(adminSupabase, user.id),
    supabase
      .from("tests")
      .select("id, title, duration_minutes")
      .eq("id", testId)
      .single(),
  ]);

  const { data: access, error: accessError } = accessResult;
  const { data: test } = testResult;

  if (accessError) {
    console.error("Failed to load mock access", accessError);
    redirect("/mock-tests");
  }

  if (!access) {
    redirect("/mock-tests");
  }

  if (!test) {
    redirect("/mock-tests");
  }

  async function startTest() {
    "use server";

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // no-op
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth");
    }

    const adminSupabase = createAdminClient();
    const { data: access, error: accessError } =
      await getLatestVerifiedSubscriptionAccess(adminSupabase, user.id);

    if (accessError) {
      console.error("Failed to load mock access", accessError);
      redirect("/mock-tests");
    }

    if (!access) {
      redirect("/mock-tests");
    }

    const { data: attempt } = await supabase
      .from("test_attempts")
      .insert({
        user_id: user.id,
        test_id: testId,
      })
      .select("id")
      .single();

    redirect(`/mock-tests/${testId}/start?attemptId=${attempt?.id}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 sm:p-6 p-4">
      <div className="max-w-6xl w-full rounded-2xl bg-white p-8 shadow-xl pb-40">
        <MockTestInstructionsContent
          title={test.title}
          durationMinutes={test.duration_minutes}
        />

        <form
          action={startTest}
          className="fixed bottom-0 items-center justify-center left-0 w-full bg-white border-t border-neutral-300 px-4 sm:py-4 py-2 flex flex-col sm:gap-4 gap-2"
        >
          <ProceedLoader />
          <label className="flex items-center sm:py-2 sm:gap-4 gap-2 sm:text-[16px] text-xs max-w-6xl text-black">
            <input
              id="confirmStart"
              name="confirmStart"
              type="checkbox"
              required
              className="w-6 h-6 rouned-lg"
            />
            {PROCEED_CONFIRMATION_TEXT}
          </label>

          <div className="flex gap-4 max-w-6xl mx-auto w-full">
            <button
              type="submit"
              className="w-full sm:text-[16px] text-xs bg-emerald-300 text-black border py-2 rounded-lg hover:opacity-90 transition"
            >
              Proceed
            </button>

            <Link
              className="w-full sm:text-[16px] text-xs flex items-center justify-center bg-red-200 text-black border py-2 rounded-lg hover:opacity-90 transition"
              href="/mock-tests"
            >
              Go Back
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
