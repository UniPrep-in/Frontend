import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMockTestsPageData } from "@/lib/mock-tests-data";
import {
  createBrowseAccess,
  getLatestVerifiedSubscriptionAccess,
  normalizeContentCategory,
} from "@/lib/subscriptions";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { searchParams } = new URL(req.url);
    const adminSupabase = createAdminClient();
    const { data: subscriptionAccess, error: accessError } = user
      ? await getLatestVerifiedSubscriptionAccess(adminSupabase, user.id)
      : { data: null, error: null };

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
    const data = await getMockTestsPageData({
      access,
      userId: user?.id ?? null,
      category,
      subject,
      page: currentPage,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Mock tests route failed", error);
    return NextResponse.json(
      { error: "Unable to load mock tests right now." },
      { status: 500 },
    );
  }
}
