import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAttemptCountsByTest,
  getSelectedFreeMockTestId,
  getVerifiedPurchasedTestIds,
} from "@/lib/mock-test-purchases";
import {
  createBrowseAccess,
  getMockContentCategory,
  getLatestVerifiedSubscriptionAccess,
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
  attemptCount: number;
  hasReachedAttemptLimit: boolean;
  canAccess: boolean;
  singleMockPricePaise: number;
};

export type MockTestsPageResponse = {
  tests: MockTest[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
};

export type ResolvedMockTestsFilters = {
  stream: MainStreamLabel;
  category: string;
  page: number;
};

export type MockTestsBootstrapResponse = MockTestsPageResponse & {
  access: SubscriptionAccess;
  subjectOptionsByStream: SubjectOptionsByStream;
  resolvedFilters: ResolvedMockTestsFilters;
};

export type SubjectOptionsByStream = Record<MainStreamLabel, string[]>;
export type MockTestsBootstrapSearchParams = {
  stream?: string | null;
  category?: string | null;
  subject?: string | null;
  page?: string | null;
};

type TestRow = {
  id: string;
  title: string;
  duration_minutes: number;
  total_marks: number;
  subject: string | null;
  stream: string | null;
  year: number;
  serial_no: number | null;
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
  "id, title, duration_minutes, total_marks, subject, stream, year, serial_no";
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

function normalizeSubjectValue(subject: string | null | undefined) {
  return subject?.trim().replace(/\s+/g, " ").toLowerCase() ?? "";
}

function formatSubjectLabel(subject: string | null | undefined) {
  return subject?.trim().replace(/\s+/g, " ") ?? "";
}

function subjectsMatch(left: string | null | undefined, right: string | null | undefined) {
  return normalizeSubjectValue(left) === normalizeSubjectValue(right);
}

function resolveSubjectOption(
  subjects: string[],
  value: string | null | undefined,
) {
  const normalizedValue = normalizeSubjectValue(value);

  if (!normalizedValue) {
    return "";
  }

  return (
    subjects.find((subject) => subjectsMatch(subject, normalizedValue)) ?? ""
  );
}

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

export function parseMockTestsPage(value?: string | null) {
  const page = Number(value ?? "1");
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function normalizeMockTestsInitialCategory(
  value: string | undefined | null,
  access: SubscriptionAccess,
  subjects: string[],
) {
  if (value === "all" || value === "english" || value === "gat") {
    if (access.allowedCategories.includes(value)) {
      return value;
    }
  }

  const resolvedSubject = resolveSubjectOption(subjects, value);

  if (resolvedSubject) {
    return resolvedSubject;
  }

  return "all";
}

export function normalizeMockTestsStreamLabel(
  value: string | undefined | null,
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

export function getMockTestsRequestParams(category: string, subjects: string[]) {
  const resolvedSubject = resolveSubjectOption(subjects, category);

  if (resolvedSubject) {
    return {
      category: "main" as const,
      subject: resolvedSubject,
    };
  }

  return {
    category: category as ContentCategory,
    subject: "",
  };
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
    data: data.filter((test) => subjectsMatch(test.subject, subject)),
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
  | "attemptCount"
  | "hasReachedAttemptLimit"
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

      const formattedSubject = formatSubjectLabel(test.subject);

      if (!formattedSubject) {
        return;
      }

      mainSubjectsByStream[contentMeta.mainStreamLabel].add(formattedSubject);
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
  const normalizedSubject =
    category === "main" ? formatSubjectLabel(subject) : "";

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

    if (normalizedSubject && !subjectsMatch(test.subject, normalizedSubject)) {
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
    { data: attemptCountsByTest, error: attemptCountsError },
    { data: selectedFreeMockTestId, error: selectedFreeMockError },
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
        ? getAttemptCountsByTest(
            adminSupabase,
            userId,
            paginatedTests.map((test) => test.id),
          )
        : Promise.resolve({ data: new Map<string, number>(), error: null }),
      userId
        ? getSelectedFreeMockTestId(adminSupabase, userId)
        : Promise.resolve({ data: null, error: null }),
    ]);

  if (purchasesError) {
    console.error("Failed to load purchased mock ids for mock tests page", purchasesError);
  }

  if (attemptCountsError) {
    console.error("Failed to resolve attempt counts for mock tests page", attemptCountsError);
  }

  if (selectedFreeMockError) {
    console.error(
      "Failed to resolve selected free mock for mock tests page",
      selectedFreeMockError,
    );
  }

  const purchasedTestIdsSafe = purchasesError ? new Set<string>() : purchasedTestIds;
  const attemptCountsByTestSafe = attemptCountsError
    ? new Map<string, number>()
    : attemptCountsByTest;
  const selectedFreeMockTestIdSafe = selectedFreeMockError
    ? null
    : selectedFreeMockTestId;
  // Single mock pricing is intentionally disabled on the page for now.
  const singleMockPricePaise = 0;

  return {
    tests: paginatedTests.map((test) => {
      const isPurchased = purchasedTestIdsSafe.has(test.id);
      const attemptCount = attemptCountsByTestSafe.get(test.id) ?? 0;
      const hasReachedAttemptLimit = attemptCount >= 2;
      const canAttemptThisMock = attemptCount < 2;
      const isFreeSerialMock = test.serial_no === 1;
      const isSelectedFreeMock =
        selectedFreeMockTestIdSafe === null || selectedFreeMockTestIdSafe === test.id;
      const hasFreeMockAvailable =
        Boolean(userId) &&
        !hasSubscriptionAccess &&
        !isPurchased &&
        isFreeSerialMock &&
        isSelectedFreeMock &&
        attemptCount === 0;
      const hasFreeAccessToThisMock = isFreeSerialMock && isSelectedFreeMock;

      return {
        ...mapTestForDisplay(test, access.baseStreamLabel),
        isPurchased,
        hasSubscriptionAccess,
        hasFreeMockAvailable,
        attemptCount,
        hasReachedAttemptLimit,
        canAccess:
          (hasSubscriptionAccess || isPurchased || hasFreeAccessToThisMock) &&
          canAttemptThisMock,
        singleMockPricePaise,
      };
    }),
    totalPages,
    currentPage: normalizedPage,
    totalCount,
  };
}

export async function getMockTestsBootstrapData({
  searchParams,
  userId = null,
}: {
  searchParams: MockTestsBootstrapSearchParams;
  userId?: string | null;
}): Promise<MockTestsBootstrapResponse> {
  const adminSupabase = createAdminClient();
  const { data: subscriptionAccess, error: accessError } = userId
    ? await getLatestVerifiedSubscriptionAccess(adminSupabase, userId)
    : { data: null, error: null };

  if (accessError) {
    throw accessError;
  }

  const requestedStream = searchParams.stream ?? null;
  const requestedCategory = searchParams.category ?? searchParams.subject ?? null;
  const access = subscriptionAccess ?? createBrowseAccess(requestedStream);
  const subjectOptionsByStream = await getSubjectOptionsByStream();
  const stream = normalizeMockTestsStreamLabel(requestedStream, access);
  const availableSubjects = subjectOptionsByStream[stream] ?? [];
  const category = normalizeMockTestsInitialCategory(
    requestedCategory,
    access,
    availableSubjects,
  );
  const requestParams = getMockTestsRequestParams(category, availableSubjects);
  const currentPage = parseMockTestsPage(searchParams.page);
  const pageData = await getMockTestsPageData({
    access,
    userId,
    category: requestParams.category,
    subject: requestParams.subject,
    page: currentPage,
  });

  return {
    ...pageData,
    access,
    subjectOptionsByStream,
    resolvedFilters: {
      stream,
      category,
      page: currentPage,
    },
  };
}
