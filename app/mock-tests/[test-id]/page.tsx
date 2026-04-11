import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MockTestInstructionsContent, {
  PROCEED_CONFIRMATION_TEXT,
} from "./MockTestInstructionsContent";
import ProceedForm from "./ProceedForm";
import { MockTestsRouteReady } from "../MockTestsNavigationLoader";
import { getMockAccessState } from "@/lib/mock-test-purchases";
import { createAdminClient } from "@/lib/supabase/admin";

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
    getMockAccessState(adminSupabase, user.id, testId),
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

  if (!access?.canAccess) {
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
    const { data: access, error: accessError } = await getMockAccessState(
      adminSupabase,
      user.id,
      testId,
    );

    if (accessError) {
      console.error("Failed to load mock access", accessError);
      redirect("/mock-tests");
    }

    if (!access?.canAccess) {
      redirect("/mock-tests");
    }

    redirect(`/mock-tests/${testId}/start?begin=1`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 sm:p-6 p-4">
      <MockTestsRouteReady />

      <div className="max-w-6xl w-full rounded-2xl bg-white p-8 shadow-xl pb-40">
        <MockTestInstructionsContent
          title={test.title}
          durationMinutes={test.duration_minutes}
        />

        <ProceedForm
          action={startTest}
          confirmationText={PROCEED_CONFIRMATION_TEXT}
        />
      </div>
    </div>
  );
}
