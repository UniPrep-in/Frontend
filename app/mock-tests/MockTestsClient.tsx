"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR, { useSWRConfig } from "swr";
import { ChevronLeft, ChevronRight, Loader2, RotateCcw } from "lucide-react";
import type {
  ContentCategory,
  MainStreamLabel,
  SubscriptionAccess,
} from "@/lib/subscriptions";

type MockTest = {
  id: string;
  title: string;
  duration_minutes: number;
  total_marks: number;
  subject: string;
  stream: string;
  year: number;
};

type MockTestsPageResponse = {
  tests: MockTest[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
};

type MockTestsClientProps = {
  access: SubscriptionAccess | null;
  subjectOptionsByStream: Record<MainStreamLabel, string[]>;
  initialParams: {
    category?: string;
    subject?: string;
    page?: string;
    stream?: string;
  };
};

type FilterState = {
  stream: MainStreamLabel;
  category: ContentCategory | string;
  page: number;
};

const CATEGORY_LABELS: Record<ContentCategory, string> = {
  all: "All",
  main: "Main Stream",
  english: "English",
  gat: "GAT",
};

function toDisplayLabel(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) =>
      word === word.toUpperCase()
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

function parsePage(value?: string) {
  const page = Number(value ?? "1");
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function normalizeInitialCategory(
  value: string | undefined,
  access: SubscriptionAccess | null,
  subjects: string[],
): string {
  // Check if it's a valid base category (excluding "main")
  if (value === "all" || value === "english" || value === "gat") {
    if (!access || access.allowedCategories.includes(value as ContentCategory)) {
      return value;
    }
  }
  
  // Check if it's a valid subject
  if (value && subjects.includes(value)) {
    return value;
  }

  return "all";
}

function normalizeStreamLabel(
  value: string | undefined,
  access: SubscriptionAccess | null,
): MainStreamLabel {
  const normalized = value?.trim().toLowerCase();

  const label =
    normalized === "science"
      ? "Science"
      : normalized === "commerce"
        ? "Commerce"
        : normalized === "arts" || normalized === "art" || normalized === "humanities"
          ? "Arts"
          : null;

  if (label && access?.selectableMainStreams.includes(label)) {
    return label;
  }

  return access?.baseStreamLabel ?? "Science";
}

function buildUrl(pathname: string, state: FilterState) {
  const params = new URLSearchParams();
  params.set("stream", state.stream.toLowerCase());

  if (state.category !== "all") {
    params.set("category", state.category);
  }

  if (state.page > 1) {
    params.set("page", String(state.page));
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function getCategoryForAPI(category: string, subjects: string[]): ContentCategory {
  // If category is a subject, return "main" for API
  if (subjects.includes(category)) {
    return "main";
  }
  return category as ContentCategory;
}

function getSubjectForAPI(category: string, subjects: string[]): string {
  // If category is a subject, return it
  if (subjects.includes(category)) {
    return category;
  }
  return "";
}

async function fetchMockTests([
  ,
  stream,
  category,
  subjects,
  page,
]: readonly [string, MainStreamLabel, string, string[], number]) {
  const params = new URLSearchParams();
  params.set("stream", stream.toLowerCase());
  
  const apiCategory = getCategoryForAPI(category, subjects);
  const apiSubject = getSubjectForAPI(category, subjects);
  
  params.set("category", apiCategory);
  
  if (apiSubject) {
    params.set("subject", apiSubject);
  }

  params.set("page", String(page));
  const response = await fetch(`/api/mock-tests?${params.toString()}`);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Please sign in to view mock tests.");
    }

    throw new Error("We could not load mock tests right now.");
  }

  return (await response.json()) as MockTestsPageResponse;
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md"
          : "bg-neutral-200 text-black hover:bg-neutral-300"
      }`}
    >
      {children}
    </button>
  );
}

export default function MockTestsClient({
  access,
  subjectOptionsByStream,
  initialParams,
}: MockTestsClientProps) {
  const { mutate } = useSWRConfig();
  const pathname = "/mock-tests";
  const hasAccess = Boolean(access);
  const initialStream = normalizeStreamLabel(initialParams.stream, access);
  const availableSubjects = subjectOptionsByStream[initialStream] ?? [];
  
  const initialCategory = normalizeInitialCategory(
    initialParams.category,
    access,
    availableSubjects,
  );
  
  const [filters, setFilters] = useState<FilterState>({
    stream: initialStream,
    category: initialCategory,
    page: parsePage(initialParams.page),
  });

  const currentSubjects = subjectOptionsByStream[filters.stream] ?? [];

  useEffect(() => {
    const nextUrl = buildUrl(pathname, filters);
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (currentUrl !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [filters, pathname]);

  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const stream = normalizeStreamLabel(
        searchParams.get("stream") ?? undefined,
        access,
      );
      const subjects = subjectOptionsByStream[stream] ?? [];
      const category = normalizeInitialCategory(
        searchParams.get("category") ?? undefined,
        access,
        subjects,
      );

      setFilters({
        stream,
        category,
        page: parsePage(searchParams.get("page") ?? "1"),
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [access, subjectOptionsByStream]);

  useEffect(() => {
    if (!access) {
      return;
    }

    // Preload all categories (excluding "main") + subjects
    const categoriesToPreload = [
      ...access.allowedCategories.filter((c) => c !== "main"),
      ...currentSubjects,
    ];
    
    categoriesToPreload.forEach((category) => {
      const key = ["mock-tests", filters.stream, category, currentSubjects, 1] as const;
      void mutate(key, fetchMockTests(key), {
        populateCache: true,
        revalidate: false,
      });
    });
  }, [access, filters.stream, currentSubjects, mutate]);

  const applyState = (nextState: FilterState) => {
    setFilters(nextState);
    window.history.pushState(null, "", buildUrl(pathname, nextState));
  };

  // Build filter options: All + non-main categories + all subjects
  const allFilterOptions: { type: "category" | "subject"; value: string; label: string }[] = [
    { type: "category", value: "all", label: CATEGORY_LABELS.all },
    // Only include non-main categories (english, gat, etc.)
    ...(access?.allowedCategories ?? [])
      .filter((c) => c !== "all" && c !== "main")
      .map((c) => ({ type: "category" as const, value: c, label: CATEGORY_LABELS[c] })),
    // Include all subjects
    ...currentSubjects.map((s) => ({ 
      type: "subject" as const, 
      value: s, 
      label: toDisplayLabel(s) 
    })),
  ];

  const swrKey = hasAccess
    ? ([
        "mock-tests",
        filters.stream,
        filters.category,
        currentSubjects,
        filters.page,
      ] as const)
    : null;

  const { data, error, isLoading, isValidating } = useSWR(
    swrKey,
    fetchMockTests,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  );

  const isInitialLoading = hasAccess && !data && (isLoading || isValidating);
  const isRefreshing = Boolean(data) && isValidating;

  const resetFilters = () => {
    applyState({ stream: filters.stream, category: "all", page: 1 });
  };

  if (!hasAccess || !access) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-600">
        <p className="mb-2 text-lg font-medium">Please sign in to view mock tests</p>
      </div>
    );
  }

  return (
    <>
      <section className="mb-8 rounded-3xl border border-neutral-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4">
          {/* Stream Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-neutral-500">Stream:</span>
            {access.isSubscriber ? (
              <span className="rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white">
                {access.baseStreamLabel}
              </span>
            ) : (
              access.selectableMainStreams.map((stream) => (
                <FilterTab
                  key={stream}
                  active={filters.stream === stream}
                  onClick={() =>
                    applyState({
                      stream,
                      category: "all",
                      page: 1,
                    })
                  }
                >
                  {stream}
                </FilterTab>
              ))
            )}
          </div>

          {/* All Filters in One Row - No "Main Stream" */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span className="mr-2 self-center text-sm font-medium text-neutral-500 shrink-0">
                Filter:
              </span>
              {allFilterOptions.map((option) => (
                <FilterTab
                  key={option.value}
                  active={filters.category === option.value}
                  onClick={() =>
                    applyState({
                      ...filters,
                      category: option.value,
                      page: 1,
                    })
                  }
                >
                  {option.label}
                </FilterTab>
              ))}
            </div>

            <button
              type="button"
              onClick={resetFilters}
              disabled={filters.category === "all"}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      </section>

      {isInitialLoading ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading mock tests...
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-700">
          <p className="text-lg font-semibold">We could not load these mocks.</p>
          <p className="mt-2 text-sm">
            {error.message || "Please try a different filter combination."}
          </p>
        </div>
      ) : null}

      {!isInitialLoading && !error && data ? (
        <>
          {isRefreshing ? (
            <div className="mb-4 flex justify-end">
              <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Refreshing
              </span>
            </div>
          ) : null}

          {data.tests.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.tests.map((test) => (
                <div
                  key={test.id}
                  className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <Image
                    src="/assets/nta.jpeg"
                    alt="NTA"
                    width={64}
                    height={64}
                    className="pointer-events-none absolute top-3 right-3 h-16 w-16 select-none opacity-50"
                  />

                  <div className="mb-2 flex gap-2">
                    {test.stream && (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                        {toDisplayLabel(test.stream)}
                      </span>
                    )}
                    {test.subject && (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        {toDisplayLabel(test.subject)}
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-semibold text-neutral-900">
                    {test.title}
                  </h2>

                  <div className="my-4 flex justify-between text-sm text-neutral-600">
                    <span>{test.duration_minutes} mins</span>
                    <span>Total Marks: {test.total_marks}</span>
                  </div>

                  <div className="mb-4 text-xs text-neutral-500">
                    Year: {test.year}
                  </div>

                  {access.isSubscriber ? (
                    <Link
                      href={`/mock-tests/${test.id}`}
                      className="inline-block rounded-xl border border-black bg-emerald-300 px-4 py-2 text-black transition hover:bg-emerald-400"
                    >
                      Start Test
                    </Link>
                  ) : (
                    <Link
                      href="/#pricing"
                      className="inline-block rounded-xl border border-black bg-sky-200 px-4 py-2 text-black transition hover:bg-sky-300"
                    >
                      Unlock With Plan
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-600">
              No mock tests found for the selected filters.
            </div>
          )}

          {data.totalPages > 1 ? (
            <div className="mt-10 flex justify-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-3 shadow-sm">
                <button
                  type="button"
                  onClick={() =>
                    applyState({
                      ...filters,
                      page: Math.max(filters.page - 1, 1),
                    })
                  }
                  disabled={filters.page === 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from(
                  { length: data.totalPages },
                  (_, index) => index + 1,
                ).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() =>
                      applyState({ ...filters, page: pageNumber })
                    }
                    className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition ${
                      filters.page === pageNumber
                        ? "bg-emerald-300 text-black shadow-lg border shadow-slate-900/20"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    applyState({
                      ...filters,
                      page: Math.min(filters.page + 1, data.totalPages),
                    })
                  }
                  disabled={filters.page === data.totalPages}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
}