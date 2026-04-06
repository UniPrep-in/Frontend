import Navbar from "../components/ui/Navbar";
import Footer from "../components/Footer";
import MockTestsClient from "./MockTestsClient";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createBrowseAccess,
  type MainStreamLabel,
  type SubscriptionAccess,
  getLatestVerifiedSubscriptionAccess,
} from "@/lib/subscriptions";
import { getMockTestsPageData, getSubjectOptionsByStream } from "@/lib/mock-tests-data";

type MockTestsPageProps = {
  searchParams: Promise<{
    page?: string;
    category?: string;
    subject?: string;
    stream?: string;
  }>;
};

export default async function MockTestsPage({
  searchParams,
}: MockTestsPageProps) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminSupabase = createAdminClient();
  const { data } = user
    ? await getLatestVerifiedSubscriptionAccess(adminSupabase, user.id)
    : { data: null };
  const access: SubscriptionAccess = data ?? createBrowseAccess(resolvedSearchParams.stream);

  const subjectOptionsByStream = await getSubjectOptionsByStream();
  const initialStream = normalizeStreamLabel(resolvedSearchParams.stream, access);
  const availableSubjects = subjectOptionsByStream[initialStream] ?? [];
  const initialCategory = normalizeInitialCategory(
    resolvedSearchParams.category,
    access,
    availableSubjects,
  );
  const initialPage = parsePage(resolvedSearchParams.page);
  const { category, subject } = getRequestParams(initialCategory, availableSubjects);
  const initialMockTestsData = await getMockTestsPageData({
    access,
    userId: user?.id ?? null,
    category,
    subject,
    page: initialPage,
  });

  return (
    <main className="flex flex-col items-center justify-center">
      <div>
        <Navbar />
      </div>

      <div className="p-8 max-w-6xl mx-auto w-full">
        <MockTestsClient
          access={access}
          subjectOptionsByStream={subjectOptionsByStream}
          initialMockTestsData={initialMockTestsData}
          initialParams={resolvedSearchParams}
        />
      </div>

      <div className="w-full">
        <Footer />
      </div>
    </main>
  );
}

function parsePage(value?: string) {
  const page = Number(value ?? "1");
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function normalizeInitialCategory(
  value: string | undefined,
  access: SubscriptionAccess,
  subjects: string[],
) {
  if (value === "all" || value === "english" || value === "gat") {
    if (access.allowedCategories.includes(value)) {
      return value;
    }
  }

  if (value && subjects.includes(value)) {
    return value;
  }

  return "all";
}

function normalizeStreamLabel(
  value: string | undefined,
  access: SubscriptionAccess,
): MainStreamLabel {
  const normalized = value?.trim().toLowerCase();

  const label =
    normalized === "science"
      ? "Science"
      : normalized === "commerce"
        ? "Commerce"
        : normalized === "arts" ||
            normalized === "art" ||
            normalized === "humanities"
          ? "Arts"
          : null;

  if (label && access.selectableMainStreams.includes(label)) {
    return label;
  }

  return access.baseStreamLabel;
}

function getRequestParams(category: string, subjects: string[]) {
  if (subjects.includes(category)) {
    return {
      category: "main" as const,
      subject: category,
    };
  }

  return {
    category: category as "all" | "english" | "gat",
    subject: "",
  };
}
