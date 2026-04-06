import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  hasConsumedFreeMock,
  getLatestOpenAttemptIdsByTest,
  getSingleMockPricePaise,
  getVerifiedPurchasedTestIds,
} from "@/lib/mock-test-purchases";
import {
  getMockContentCategory,
  normalizeContentStreamLabel,
  resolveContentMeta,
  type ContentCategory,
  type MainStreamLabel,
  type SubscriptionAccess,
} from "@/lib/subscriptions";

export const MOCK_TESTS_PAGE_SIZE = 9;

export type MockTest = {
  id: string;
  title: string;
  duration_minutes: number;
  total_marks: number;
  subject: string;
  stream: string;
  year: number;
  isPurchased: boolean;
  hasSubscriptionAccess: boolean;
  hasFreeMockAvailable: boolean;
  activeAttemptId: string | null;
  canAccess: boolean;
  singleMockPricePaise: number;
};

export type MockTestsPageResponse = {
  tests: MockTest[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
};

export type SubjectOptionsByStream = Record<MainStreamLabel, string[]>;

type TestRow = {
  id: string;
  title: string;
  duration_minutes: number;
  total_marks: number;
  subject: string | null;
  stream: string | null;
  year: number;
};

type GetMockTestsPageDataInput = {
  access: SubscriptionAccess;
  userId?: string | null;
  category: ContentCategory;
  subject?: string;
  page: number;
  pageSize?: number;
};

const TEST_SELECT =
  "id, title, duration_minutes, total_marks, subject, stream, year";
const MAIN_STREAM_QUERY_ALIASES: Record<MainStreamLabel, string[]> = {
  Science: ["Science", "science"],
  Commerce: ["Commerce", "commerce"],
  Arts: ["Arts", "Art", "arts", "art", "Humanities", "humanities"],
};
const ENGLISH_SUBJECT_QUERY_ALIASES = ["english", "grammar", "comprehension"];
const GAT_SUBJECT_QUERY_ALIASES = [
  "gat",
  "general test",
  "general aptitude test",
  "general aptitude",
  "reasoning",
  "current affairs",
  "quantitative aptitude",
];

function getEmptySubjectOptionsByStream(): SubjectOptionsByStream {
  return {
    Science: [],
    Commerce: [],
    Arts: [],
  };
}

function normalizePage(page: number) {
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function dedupeTests(tests: TestRow[]) {
  const deduped = new Map<string, TestRow>();

  tests.forEach((test) => {
    deduped.set(test.id, test);
  });

  return Array.from(deduped.values()).sort((left, right) => {
    if (right.year !== left.year) {
      return right.year - left.year;
    }

    return left.title.localeCompare(right.title);
  });
}

async function fetchTestsByIlikeValues(
  supabase: ReturnType<typeof createAdminClient>,
  column: "stream" | "subject",
  values: string[],
) {
  if (values.length === 0) {
    return { data: [] as TestRow[], error: null };
  }

  const results = await Promise.all(
    values.map((value) =>
      supabase
        .from("tests")
        .select(TEST_SELECT)
        .ilike(column, value)
        .order("year", { ascending: false }),
    ),
  );

  const failedResult = results.find((result) => result.error);

  if (failedResult?.error) {
    return { data: [] as TestRow[], error: failedResult.error };
  }

  return {
    data: dedupeTests(results.flatMap((result) => (result.data as TestRow[]) ?? [])),
    error: null,
  };
}

async function fetchMainStreamTests(
  supabase: ReturnType<typeof createAdminClient>,
  baseStreamLabel: MainStreamLabel,
  subject: string,
) {
  const { data, error } = await fetchTestsByIlikeValues(
    supabase,
    "stream",
    MAIN_STREAM_QUERY_ALIASES[baseStreamLabel] ?? [],
  );

  if (error) {
    return { data: [] as TestRow[], error };
  }

  if (!subject) {
    return { data, error: null };
  }

  return {
    data: data.filter((test) => test.subject === subject),
    error: null,
  };
}

async function fetchCandidateTests(
  supabase: ReturnType<typeof createAdminClient>,
  access: Pick<SubscriptionAccess, "baseStreamLabel" | "hasGat">,
  category: ContentCategory,
  subject: string,
) {
  if (category === "main") {
    return fetchMainStreamTests(supabase, access.baseStreamLabel, subject);
  }

  if (category === "english") {
    return fetchTestsByIlikeValues(
      supabase,
      "subject",
      ENGLISH_SUBJECT_QUERY_ALIASES,
    );
  }

  if (category === "gat") {
    if (!access.hasGat) {
      return { data: [] as TestRow[], error: null };
    }

    return fetchTestsByIlikeValues(supabase, "subject", GAT_SUBJECT_QUERY_ALIASES);
  }

  const requests = [
    fetchMainStreamTests(supabase, access.baseStreamLabel, ""),
    fetchTestsByIlikeValues(supabase, "subject", ENGLISH_SUBJECT_QUERY_ALIASES),
  ];

  if (access.hasGat) {
    requests.push(fetchTestsByIlikeValues(supabase, "subject", GAT_SUBJECT_QUERY_ALIASES));
  }

  const results = await Promise.all(requests);
  const failedResult = results.find((result) => result.error);

  if (failedResult?.error) {
    return { data: [] as TestRow[], error: failedResult.error };
  }

  return {
    data: dedupeTests(results.flatMap((result) => result.data)),
    error: null,
  };
}

function mapTestForDisplay(
  test: TestRow,
  baseStreamLabel: MainStreamLabel,
): Omit<
  MockTest,
  | "isPurchased"
  | "hasSubscriptionAccess"
  | "hasFreeMockAvailable"
  | "activeAttemptId"
  | "canAccess"
  | "singleMockPricePaise"
> {
  const testCategory =
    getMockContentCategory(test.stream, test.subject, baseStreamLabel) ?? "main";

  const displayStream =
    testCategory === "main"
      ? normalizeContentStreamLabel(test.stream) ?? baseStreamLabel
      : testCategory === "english"
        ? "English"
        : "GAT";

  return {
    id: test.id,
    title: test.title,
    duration_minutes: test.duration_minutes,
    total_marks: test.total_marks,
    subject: test.subject ?? "",
    stream: displayStream,
    year: test.year,
  };
}

const getCachedSubjectOptionsByStream = unstable_cache(
  async (): Promise<SubjectOptionsByStream> => {
    const adminSupabase = createAdminClient();
    const { data: tests, error } = await adminSupabase
      .from("tests")
      .select("stream, subject")
      .not("subject", "is", null);

    if (error || !tests) {
      console.error("Error fetching mock filter options:", error);
      return getEmptySubjectOptionsByStream();
    }

    const mainSubjectsByStream = {
      Science: new Set<string>(),
      Commerce: new Set<string>(),
      Arts: new Set<string>(),
    };

    (tests as Pick<TestRow, "stream" | "subject">[]).forEach((test) => {
      if (!test.subject) {
        return;
      }

      const contentMeta = resolveContentMeta(test.stream, test.subject);

      if (
        !contentMeta ||
        contentMeta.category !== "main" ||
        !contentMeta.mainStreamLabel
      ) {
        return;
      }

      mainSubjectsByStream[contentMeta.mainStreamLabel].add(test.subject);
    });

    return {
      Science: Array.from(mainSubjectsByStream.Science).sort(),
      Commerce: Array.from(mainSubjectsByStream.Commerce).sort(),
      Arts: Array.from(mainSubjectsByStream.Arts).sort(),
    };
  },
  ["mock-test-subject-options"],
  { revalidate: 3600 },
);

export async function getSubjectOptionsByStream() {
  return getCachedSubjectOptionsByStream();
}

const getCachedCandidateTests = unstable_cache(
  async (
    baseStreamLabel: MainStreamLabel,
    hasGat: boolean,
    category: ContentCategory,
    subject: string,
  ) => {
    const adminSupabase = createAdminClient();
    const { data, error } = await fetchCandidateTests(
      adminSupabase,
      { baseStreamLabel, hasGat },
      category,
      subject,
    );

    if (error) {
      throw error;
    }

    return data;
  },
  ["mock-tests-candidate-tests"],
  { revalidate: 300 },
);

export async function getMockTestsPageData({
  access,
  userId = null,
  category,
  subject = "",
  page,
  pageSize = MOCK_TESTS_PAGE_SIZE,
}: GetMockTestsPageDataInput): Promise<MockTestsPageResponse> {
  const normalizedPage = normalizePage(page);
  const normalizedSubject = category === "main" ? subject.trim() : "";

  if (category !== "all" && !access.allowedCategories.includes(category)) {
    return {
      tests: [],
      totalPages: 0,
      currentPage: normalizedPage,
      totalCount: 0,
    };
  }

  const candidateTests = await getCachedCandidateTests(
    access.baseStreamLabel,
    access.hasGat,
    category,
    normalizedSubject,
  );

  const filteredTests = candidateTests.filter((test) => {
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

    if (normalizedSubject && test.subject !== normalizedSubject) {
      return false;
    }

    return true;
  });

  const totalCount = filteredTests.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const from = (normalizedPage - 1) * pageSize;
  const paginatedTests = filteredTests.slice(from, from + pageSize);
  const adminSupabase = createAdminClient();
  const hasSubscriptionAccess = access.isSubscriber;
  const [
    { data: purchasedTestIds, error: purchasesError },
    freeMockResult,
    { data: openAttemptIdsByTest, error: openAttemptsError },
    priceResult,
  ] =
    await Promise.all([
      userId
        ? getVerifiedPurchasedTestIds(
            adminSupabase,
            userId,
            paginatedTests.map((test) => test.id),
          )
        : Promise.resolve({ data: new Set<string>(), error: null }),
      userId
        ? hasConsumedFreeMock(adminSupabase, userId)
        : Promise.resolve({ data: false, error: null }),
      userId
        ? getLatestOpenAttemptIdsByTest(
            adminSupabase,
            userId,
            paginatedTests.map((test) => test.id),
          )
        : Promise.resolve({ data: new Map<string, string>(), error: null }),
      getSingleMockPricePaise(adminSupabase),
    ]);

  if (purchasesError) {
    throw purchasesError;
  }

  if (freeMockResult.error) {
    throw freeMockResult.error;
  }

  if (openAttemptsError) {
    throw openAttemptsError;
  }

  if (priceResult.error || !priceResult.data) {
    throw new Error(priceResult.error?.message || "Single mock price is not configured");
  }

  const hasFreeMockAvailable = Boolean(userId) && !hasSubscriptionAccess && !freeMockResult.data;

  return {
    tests: paginatedTests.map((test) => {
      const isPurchased = purchasedTestIds.has(test.id);
      const activeAttemptId = openAttemptIdsByTest.get(test.id) ?? null;

      return {
        ...mapTestForDisplay(test, access.baseStreamLabel),
        isPurchased,
        hasSubscriptionAccess,
        hasFreeMockAvailable,
        activeAttemptId,
        canAccess:
          hasSubscriptionAccess ||
          isPurchased ||
          hasFreeMockAvailable ||
          Boolean(activeAttemptId),
        singleMockPricePaise: priceResult.data,
      };
    }),
    totalPages,
    currentPage: normalizedPage,
    totalCount,
  };
}
