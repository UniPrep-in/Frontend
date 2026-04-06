import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getMockTestsPageData,
  getMockTestsRequestParams,
  getSubjectOptionsByStream,
  normalizeMockTestsInitialCategory,
  normalizeMockTestsStreamLabel,
  parseMockTestsPage,
  type MockTestsBootstrapResponse,
} from "@/lib/mock-tests-data";
import {
  createBrowseAccess,
  getLatestVerifiedSubscriptionAccess,
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
    const subjectOptionsByStream = await getSubjectOptionsByStream();
    const stream = normalizeMockTestsStreamLabel(searchParams.get("stream"), access);
    const availableSubjects = subjectOptionsByStream[stream] ?? [];
    const category = normalizeMockTestsInitialCategory(
      searchParams.get("category"),
      access,
      availableSubjects,
    );
    const requestParams = getMockTestsRequestParams(category, availableSubjects);
    const currentPage = parseMockTestsPage(searchParams.get("page"));
    const pageData = await getMockTestsPageData({
      access,
      userId: user?.id ?? null,
      category: requestParams.category,
      subject: requestParams.subject,
      page: currentPage,
    });

    const response: MockTestsBootstrapResponse = {
      ...pageData,
      access,
      subjectOptionsByStream,
      resolvedFilters: {
        stream,
        category,
        page: currentPage,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Mock tests route failed", error);
    return NextResponse.json(
      { error: "Unable to load mock tests right now." },
      { status: 500 },
    );
  }
}
