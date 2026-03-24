import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createBrowseAccess,
  getLatestVerifiedSubscriptionAccess,
  getMockContentCategory,
  normalizeContentCategory,
  normalizeContentStreamLabel,
} from "@/lib/subscriptions";

const PAGE_SIZE = 6;

type TestRow = {
  id: string;
  title: string;
  duration_minutes: number;
  total_marks: number;
  subject: string | null;
  stream: string | null;
  year: number;
};

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please sign in to view mock tests." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const adminSupabase = createAdminClient();
    const { data: subscriptionAccess, error: accessError } =
      await getLatestVerifiedSubscriptionAccess(adminSupabase, user.id);

    if (accessError) {
      console.error("Failed to load mock access", accessError);
      return NextResponse.json(
        { error: "Unable to load mock tests right now." },
        { status: 500 },
      );
    }

    const access = subscriptionAccess ?? createBrowseAccess(searchParams.get("stream"));
    const category = normalizeContentCategory(searchParams.get("category"));
    const requestedSubject = searchParams.get("subject")?.trim() || "";
    const subject = category === "main" ? requestedSubject : "";
    const page = Number(searchParams.get("page") || "1");
    const currentPage = Number.isInteger(page) && page > 0 ? page : 1;

    const { data, error } = await adminSupabase
      .from("tests")
      .select("id, title, duration_minutes, total_marks, subject, stream, year")
      .order("year", { ascending: false });

    if (error) {
      console.error("Failed to load mock tests", error);
      return NextResponse.json(
        { error: "Unable to load mock tests right now." },
        { status: 500 },
      );
    }

    const filteredTests = (data as TestRow[]).filter((test) => {
      const testCategory = getMockContentCategory(
        test.stream,
        test.subject,
        access.baseStreamLabel,
      );

      if (!testCategory) {
        return false;
      }

      if (category !== "all" && testCategory !== category) {
        return false;
      }

      if (testCategory === "gat" && !access.hasGat) {
        return false;
      }

      if (subject && test.subject !== subject) {
        return false;
      }

      return true;
    });

    const totalCount = filteredTests.length;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const from = (currentPage - 1) * PAGE_SIZE;
    const paginatedTests = filteredTests.slice(from, from + PAGE_SIZE);

    return NextResponse.json({
      tests: paginatedTests.map((test) => {
        const testCategory =
          getMockContentCategory(test.stream, test.subject, access.baseStreamLabel) ??
          "main";

        const displayStream =
          testCategory === "main"
            ? normalizeContentStreamLabel(test.stream) ?? access.baseStreamLabel
            : testCategory === "english"
              ? "English"
              : "GAT";

        return {
          ...test,
          stream: displayStream,
        };
      }),
      totalPages,
      currentPage,
      totalCount,
    });
  } catch (error) {
    console.error("Mock tests route failed", error);
    return NextResponse.json(
      { error: "Unable to load mock tests right now." },
      { status: 500 },
    );
  }
}
