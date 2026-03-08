import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

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
    }
  );

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Fetch test details
  const { data: test } = await supabase
    .from("tests")
    .select("*")
    .eq("id", testId)
    .single();

  if (!test) {
    redirect("/mock-tests");
  }

  // Fetch total questions count
  const { count } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("test_id", testId);

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
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth");
    }

    const { data: attempt } = await supabase
      .from("test_attempts")
      .insert({
        user_id: user.id,
        test_id: testId,
      })
      .select()
      .single();

    redirect(`/mock-tests/${testId}/start?attemptId=${attempt?.id}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-6">
      <div className="max-w-2xl w-full rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-4">{test.title}</h1>

        <div className="space-y-2 text-gray-600">
          <p>
            <strong className="text-black">Year:</strong> {test.year}
          </p>
          <p>
            <strong>Duration:</strong> {test.duration_minutes} minutes
          </p>
          <p>
            <strong>Total Questions:</strong> {count}
          </p>
          <p>
            <strong>Total Marks:</strong> {test.total_marks}
          </p>
        </div>

        <div className="mt-6">
          <h2 className="font-semibold mb-2">Instructions:</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            <li>Each question carries allotted marks.</li>
            <li>Negative marking applies where specified.</li>
            <li>Test will auto-submit when time expires.</li>
            <li>Do not refresh or close the browser during the test.</li>
          </ul>
        </div>

        <form action={startTest} className="mt-8 flex gap-4">
          <button
            type="submit"
            className="w-full bg-emerald-300 text-black border py-3 rounded-lg hover:opacity-90 transition"
          >
            Start Test
          </button>
          <Link className="w-full flex items-center justify-center bg-red-200 text-black border py-3 rounded-lg hover:opacity-90 transition" href="/mock-tests">Go Back</Link>
        </form>
      </div>
    </div>
  );
}