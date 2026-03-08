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
    },
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
      },
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
      <div className="max-w-6xl w-full rounded-2xl bg-white p-8 shadow-xl pb-40">
        <h1 className="text-2xl font-semibold border-b">General Instruction</h1>
        <ul className="space-y-2 p-6 text-neutral-600 list-decimal">
          <li>
            Total Duration of the examination is defined per mock(usually 60
            minutes)
          </li>
          <li>
            The clock will be set at the server. The countdown timer in the top
            right corner of the screen will display the remaining time available
            for you to complete the examination. When the timer reaches zero,
            the examination will end itself. You will not be required to end or
            submit your examination.
          </li>
          <li>
            The question palette displayed on the right side of screen will show
            the status of each question using one of the following symbols:
            <div className="bg-neutral-100 flex flex-col my-4 gap-4 p-4 rounded-lg border border-neutral-200">
              <div className="flex gap-4 items-center">
                <div className="px-4 rounded-lg py-2 bg-white border border-neutral-200">
                  1
                </div>
                <span>You have not visited the question yet.</span>
              </div>
              <div className="flex gap-4 items-center">
                <div className="px-4 py-2 rounded-t-full bg-red-500 text-white">
                  2
                </div>
                <span>You have not answered the question</span>
              </div>
              <div className="flex gap-4 items-center">
                <div className="px-4 py-2 rounded-t-full bg-green-500 text-white">
                  3
                </div>
                <span>You have answered the question.</span>
              </div>
              <div className="flex gap-4 items-center">
                <div className="px-4 rounded-full py-2 bg-purple-600 text-white">
                  4
                </div>
                <span>
                  The question(s) marked for review will not be considered for
                  evaluation
                </span>
              </div>
              <div className="flex gap-4 items-center">
                <div className="px-4 relative rounded-full py-2 text-white bg-purple-600">
                  5
                  <span className="absolute top-7 right-[-2] w-3 h-3 bg-green-500 rounded-full"></span>
                </div>
                <span>
                  The question(s) aswered and marked for review will be
                  considered for evaluation.
                </span>
              </div>
            </div>
          </li>
          <h1 className="underline underline-black underline-offset-2 text-black text-2xl font-semibold">Navigating to a question:</h1>
          <li>
            To answer a question do the following :
              <ul className="list-disc px-4">
                <li>Click on the question number in the question palette at the right of your screen to go to that numbered question directly.</li>
                <li>Click on Save & Next to save your answer for the current question and then go to the next question.</li>
                <li>Click on Mark for Review & Next to save your answer for the current question, mark for review, and then fo to the next question.</li>
              </ul>
          </li>
          <h1 className="underline underline-black underline-offset-2 text-black text-2xl font-semibold">Answering a Question:</h1>
          <li>Procedure for answering a multiple choice type question:</li>
        </ul>

        <form
          action={startTest}
          className="fixed bottom-0 items-center justify-center left-0 w-full bg-white border-t border-neutral-300 p-4 flex flex-col gap-4"
        >
          <label className="flex items-center py-2 gap-3 text-md max-w-6xl text-black">
            <input
              id="confirmStart"
              name="confirmStart"
              type="checkbox"
              required
              className="w-6 h-6 rouned-lg"
            />
            I have read and understood the instruction. All computer hardware alloted to me are in proper working condition. I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like mobile phone, bluetooth devices etc. I agree that in case of not adhering to the instructions, I shall be liable to be debarded from this test and/or to disciplinary action which may include ban from future Tests/Examinations.
          </label>

          <div className="flex gap-4 max-w-6xl mx-auto w-full">
            <button
              type="submit"
              className="w-full bg-emerald-300 text-black border py-3 rounded-lg hover:opacity-90 transition"
            >
              Proceed
            </button>

            <Link
              className="w-full flex items-center justify-center bg-red-200 text-black border py-3 rounded-lg hover:opacity-90 transition"
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
