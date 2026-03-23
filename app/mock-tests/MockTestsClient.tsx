"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { ChevronLeft, ChevronRight, Loader2, RotateCcw } from "lucide-react";

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

type FilterTree = {
  [stream: string]: string[];
};

type MockTestsClientProps = {
  filterTree: FilterTree;
  streams: string[];
  subjects: string[];
  initialParams: {
    stream?: string;
    subject?: string;
    page?: string;
  };
};

type FilterState = {
  stream: string;
  subject: string;
  page: number;
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

function buildUrl(pathname: string, state: FilterState) {
  const params = new URLSearchParams();

  if (state.stream) {
    params.set("stream", state.stream);
  }

  if (state.subject) {
    params.set("subject", state.subject);
  }

  if (state.page > 1) {
    params.set("page", String(state.page));
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

async function fetchMockTests([
  ,
  stream,
  subject,
  page,
]: readonly [string, string, string, number]) {
  const params = new URLSearchParams();
  
  if (stream) params.set("stream", stream);
  if (subject) params.set("subject", subject);
  params.set("page", String(page));

  const response = await fetch(`/api/mock-tests?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    throw new Error(payload?.error || "Unable to load mock tests");
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
          ? "bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-md"
          : "bg-neutral-200 text-black hover:bg-neutral-300"
      }`}
    >
      {children}
    </button>
  );
}

export default function MockTestsClient({
  filterTree,
  streams,
  subjects,
  initialParams,
}: MockTestsClientProps) {
  const pathname = "/mock-tests";
  
  const [filters, setFilters] = useState<FilterState>({
    stream: initialParams.stream?.trim() ?? "",
    subject: initialParams.subject?.trim() ?? "",
    page: parsePage(initialParams.page),
  });

  // Update URL when filters change
  useEffect(() => {
    const nextUrl = buildUrl(pathname, filters);
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (currentUrl !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [filters, pathname]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      setFilters({
        stream: searchParams.get("stream")?.trim() ?? "",
        subject: searchParams.get("subject")?.trim() ?? "",
        page: parsePage(searchParams.get("page") ?? "1"),
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const applyState = (nextState: FilterState) => {
    setFilters(nextState);
    window.history.pushState(null, "", buildUrl(pathname, nextState));
  };

  // Get available subjects based on selected stream
  const availableSubjects = filters.stream && filterTree[filters.stream] 
    ? filterTree[filters.stream] 
    : [];

  // Reset subject when stream changes
  const handleStreamChange = (stream: string) => {
    applyState({
      stream,
      subject: "", // Reset subject when stream changes
      page: 1,
    });
  };

  const handleSubjectChange = (subject: string) => {
    applyState({
      ...filters,
      subject,
      page: 1,
    });
  };

  const isReadyToFetch = Boolean(filters.stream || filters.subject);
  
  const swrKey = isReadyToFetch
    ? (["mock-tests", filters.stream, filters.subject, filters.page] as const)
    : null;

  const { data, error, isLoading, isValidating } = useSWR(swrKey, fetchMockTests, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  });

  const isInitialLoading = isReadyToFetch && !data && (isLoading || isValidating);
  const isRefreshing = Boolean(data) && isValidating;

  const resetFilters = () => {
    applyState({ stream: "", subject: "", page: 1 });
  };

  return (
    <>
      {/* Filters Section */}
      <section className="mb-8 rounded-3xl border border-neutral-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4">
          
          {/* Stream Filter */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span className="self-center text-sm font-medium text-neutral-500 mr-2">
                Stream:
              </span>
              {streams.map((stream) => (
                <FilterTab
                  key={stream}
                  active={filters.stream === stream}
                  onClick={() => handleStreamChange(stream)}
                >
                  {toDisplayLabel(stream)}
                </FilterTab>
              ))}
            </div>

            <button
              type="button"
              onClick={resetFilters}
              disabled={!filters.stream && !filters.subject}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>

          {/* Subject Filter */}
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium text-neutral-500 mr-2">
              Subject:
            </span>
            {filters.stream ? (
              availableSubjects.length > 0 ? (
                availableSubjects.map((subject) => (
                  <FilterTab
                    key={subject}
                    active={filters.subject === subject}
                    onClick={() => handleSubjectChange(subject)}
                  >
                    {toDisplayLabel(subject)}
                  </FilterTab>
                ))
              ) : (
                <span className="text-sm text-neutral-400">
                  No subjects available for this stream
                </span>
              )
            ) : (
              subjects.map((subject) => (
                <FilterTab
                  key={subject}
                  active={filters.subject === subject}
                  onClick={() => handleSubjectChange(subject)}
                >
                  {toDisplayLabel(subject)}
                </FilterTab>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Loading State */}
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

      {/* Error State */}
      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-700">
          <p className="text-lg font-semibold">We could not load these mocks.</p>
          <p className="mt-2 text-sm">
            {error.message || "Please try a different filter combination."}
          </p>
        </div>
      ) : null}

      {/* Results */}
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
                  className="relative rounded-2xl p-4 shadow-sm hover:shadow-md transition overflow-hidden border border-neutral-200 bg-white"
                >
                  <Image
                    src="/assets/nta.jpeg"
                    alt="NTA"
                    width={64}
                    height={64}
                    className="absolute top-3 right-3 h-16 w-16 opacity-50 pointer-events-none select-none"
                  />
                  
                  {/* Stream & Subject Tags */}
                  <div className="flex gap-2 mb-2">
                    {test.stream && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                        {toDisplayLabel(test.stream)}
                      </span>
                    )}
                    {test.subject && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                        {toDisplayLabel(test.subject)}
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-semibold text-neutral-900">{test.title}</h2>
                  
                  <div className="flex justify-between my-4 text-sm text-neutral-600">
                    <span>{test.duration_minutes} mins</span>
                    <span>Total Marks: {test.total_marks}</span>
                  </div>

                  <div className="text-xs text-neutral-500 mb-4">
                    Year: {test.year}
                  </div>

                  <Link
                    href={`/mock-tests/${test.id}`}
                    className="inline-block px-4 py-2 bg-emerald-300 border border-black text-black rounded-xl hover:bg-emerald-400 transition"
                  >
                    Start Test
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-600">
              No mock tests found for the selected filters.
            </div>
          )}

          {/* Pagination */}
          {data.totalPages > 1 ? (
            <div className="mt-10 flex justify-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-3 shadow-sm">
                <button
                  type="button"
                  onClick={() =>
                    applyState({ ...filters, page: Math.max(filters.page - 1, 1) })
                  }
                  disabled={filters.page === 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: data.totalPages }, (_, index) => index + 1).map(
                  (pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => applyState({ ...filters, page: pageNumber })}
                      className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition ${
                        filters.page === pageNumber
                          ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                          : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ),
                )}

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

      {/* Empty State - No filters selected */}
      {!isReadyToFetch && !isInitialLoading && !data && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-600">
          <p className="text-lg font-medium mb-2">Select a stream or subject</p>
          <p className="text-sm">Choose a filter above to see available mock tests</p>
        </div>
      )}
    </>
  );
}