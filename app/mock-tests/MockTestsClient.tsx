"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
} from "lucide-react";
import type {
  MockTest,
  MockTestsBootstrapResponse,
  MockTestsPageResponse,
} from "@/lib/mock-tests-data";
import Loader from "@/app/components/ui/loader";
import {
  loadRazorpayCheckoutScript,
  type RazorpaySuccessResponse,
} from "@/lib/razorpay-checkout";
import { useAuth } from "@/providers/AuthProvider";
import {
  type ContentCategory,
  getDisplayPriceRupees,
  type MainStreamLabel,
} from "@/lib/subscriptions";

type MockTestsClientProps = {
  initialParams: {
    category?: string;
    subject?: string;
    page?: string;
    stream?: string;
  };
  initialData: MockTestsBootstrapResponse;
  initialUserId: string | null;
};

type FilterState = {
  stream: MainStreamLabel;
  category: ContentCategory | string;
  page: number;
};

type CheckoutOrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  testId: string;
  testTitle: string;
  singleMockPricePaise: number;
  finalAmountPaise: number;
  error?: string;
};

type VerifyPaymentResponse = {
  success?: boolean;
  error?: string;
  testId?: string;
  paymentStatus?: string;
};

const CATEGORY_LABELS: Record<ContentCategory, string> = {
  all: "All",
  main: "Main Stream",
  english: "English",
  gat: "GAT",
};

const CHECKOUT_ERROR_MESSAGE =
  "We couldn't start mock checkout right now. Please try again in a moment.";
const VERIFY_ERROR_MESSAGE =
  "We couldn't confirm your payment right now. If money was deducted, please contact support.";
const ENABLE_SINGLE_MOCK_PURCHASES = false;

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

function parseStreamLabel(value?: string): MainStreamLabel {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "commerce") {
    return "Commerce";
  }

  if (
    normalized === "arts" ||
    normalized === "art" ||
    normalized === "humanities"
  ) {
    return "Arts";
  }

  return "Science";
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

async function fetchMockTests([, stream, category, page]: readonly [
  string,
  MainStreamLabel,
  string,
  number,
]): Promise<MockTestsBootstrapResponse> {
  const params = new URLSearchParams();
  params.set("stream", stream.toLowerCase());
  params.set("category", category);
  params.set("page", String(page));
  const response = await fetch(`/api/mock-tests?${params.toString()}`);

  if (!response.ok) {
    throw new Error("We could not load mock tests right now.");
  }

  return (await response.json()) as MockTestsBootstrapResponse;
}

function FilterTab({
  active,
  disabled = false,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md"
          : "bg-neutral-200 text-black hover:bg-neutral-300"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {children}
    </button>
  );
}

function getCheckoutErrorMessage(status?: number) {
  if (status === 401) {
    return "Please sign in and try again.";
  }

  if (status === 404) {
    return "This mock could not be found.";
  }

  if (status === 400) {
    return "This mock is already unlocked or cannot be purchased right now.";
  }

  return CHECKOUT_ERROR_MESSAGE;
}

function getVerifyErrorMessage(status?: number) {
  if (status === 401) {
    return "Please sign in and try again.";
  }

  if (status === 400) {
    return "Your payment could not be verified for this mock.";
  }

  return VERIFY_ERROR_MESSAGE;
}

export default function MockTestsClient({
  initialParams,
  initialData,
  initialUserId,
}: MockTestsClientProps) {
  const FILTER_SCROLL_OFFSET = 112;
  const router = useRouter();
  const { user, profile, isAuthLoading } = useAuth();
  const { mutate } = useSWRConfig();
  const filterSectionRef = useRef<HTMLElement | null>(null);
  const previousPageRef = useRef<number | null>(null);
  const pendingScrollPageRef = useRef<number | null>(null);
  const hasHandledInitialAuthSyncRef = useRef(false);
  const [pendingFilterKey, setPendingFilterKey] = useState<string | null>(null);
  const pathname = "/mock-tests";
  const initialResolvedFilters = initialData.resolvedFilters;
  const [filters, setFilters] = useState<FilterState>({
    stream: initialResolvedFilters?.stream ?? parseStreamLabel(initialParams.stream),
    category: initialResolvedFilters?.category ?? initialParams.category ?? "all",
    page: initialResolvedFilters?.page ?? parsePage(initialParams.page),
  });
  const [selectedTest, setSelectedTest] = useState<MockTest | null>(null);
  const [purchasingTestId, setPurchasingTestId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const swrKey = [
    "mock-tests",
    filters.stream,
    filters.category,
    filters.page,
  ] as const;

  useEffect(() => {
    const nextUrl = buildUrl(pathname, filters);
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (currentUrl !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [filters, pathname]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedback(null);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [feedback]);

  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const nextState = {
        stream: parseStreamLabel(searchParams.get("stream") ?? undefined),
        category: searchParams.get("category") ?? "all",
        page: parsePage(searchParams.get("page") ?? "1"),
      };

      setPendingFilterKey(null);
      setFilters(nextState);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const applyState = (nextState: FilterState) => {
    const isFilterChanging =
      nextState.stream !== filters.stream || nextState.category !== filters.category;

    if (nextState.page !== filters.page) {
      pendingScrollPageRef.current = nextState.page;
    }

    if (isFilterChanging) {
      setPendingFilterKey(`${nextState.stream}:${nextState.category}`);
    }

    setFilters(nextState);
    window.history.pushState(null, "", buildUrl(pathname, nextState));
  };

  const { data, error, isLoading } = useSWR(swrKey, fetchMockTests, {
    fallbackData:
      filters.stream === initialData.resolvedFilters.stream &&
      filters.category === initialData.resolvedFilters.category &&
      filters.page === initialData.resolvedFilters.page
        ? initialData
        : undefined,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    keepPreviousData: true,
    dedupingInterval: 15000,
  });

  const access = data?.access;
  const subjectOptionsByStream = data?.subjectOptionsByStream;
  const currentSubjects =
    access && subjectOptionsByStream
      ? subjectOptionsByStream[filters.stream] ?? []
      : [];

  const allFilterOptions: {
    type: "category" | "subject";
    value: string;
    label: string;
  }[] = access
    ? [
        { type: "category", value: "all", label: CATEGORY_LABELS.all },
        ...access.allowedCategories
          .filter((category) => category !== "all" && category !== "main")
          .map((category) => ({
            type: "category" as const,
            value: category,
            label: CATEGORY_LABELS[category],
          })),
        ...currentSubjects.map((subject) => ({
          type: "subject" as const,
          value: subject,
          label: toDisplayLabel(subject),
        })),
      ]
    : [];

  const visibleData: MockTestsPageResponse | undefined = useMemo(
    () =>
      data
        ? {
            tests: data.tests,
            totalPages: data.totalPages,
            currentPage: data.currentPage,
            totalCount: data.totalCount,
          }
        : undefined,
    [data],
  );
  const shouldShowLoadingState = isLoading && !visibleData;
  const shouldShowErrorState = !shouldShowLoadingState && !visibleData && Boolean(error);
  const resolvedFilterKey = data
    ? `${data.resolvedFilters.stream}:${data.resolvedFilters.category}`
    : null;
  const currentFilterKey = `${filters.stream}:${filters.category}`;
  const isAwaitingRequestedFilter =
    pendingFilterKey !== null && pendingFilterKey === currentFilterKey;
  const isFilterTransitioning =
    isAwaitingRequestedFilter ||
    (isLoading && data
      ? data.resolvedFilters.stream !== filters.stream ||
        data.resolvedFilters.category !== filters.category
      : false);
  const isPageTransitioning =
    isLoading && visibleData
      ? visibleData.currentPage !== filters.page
      : false;
  const isResultsTransitioning = isFilterTransitioning || isPageTransitioning;
  const displayedPage = visibleData?.currentPage ?? filters.page;

  useEffect(() => {
    if (!pendingFilterKey) {
      return;
    }

    if (resolvedFilterKey === pendingFilterKey && !isLoading) {
      setPendingFilterKey(null);
    }
  }, [isLoading, pendingFilterKey, resolvedFilterKey]);

  const scrollToFilters = (behavior: ScrollBehavior) => {
    const filterTop =
      (filterSectionRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY;

    window.scrollTo({
      top: Math.max(filterTop - FILTER_SCROLL_OFFSET, 0),
      behavior,
    });
  };

  useEffect(() => {
    if (!visibleData) {
      previousPageRef.current = filters.page;
      return;
    }

    const shouldScrollToFilters =
      pendingScrollPageRef.current === filters.page &&
      visibleData.currentPage === filters.page &&
      previousPageRef.current !== null &&
      previousPageRef.current !== filters.page;

    if (shouldScrollToFilters) {
      let correctionTimeoutId: number | null = null;

      requestAnimationFrame(() => {
        scrollToFilters("smooth");
        correctionTimeoutId = window.setTimeout(() => {
          scrollToFilters("auto");
        }, 260);
      });

      pendingScrollPageRef.current = null;
      previousPageRef.current = filters.page;

      return () => {
        if (correctionTimeoutId !== null) {
          window.clearTimeout(correctionTimeoutId);
        }
      };
    }

    previousPageRef.current = filters.page;
  }, [filters.page, visibleData, FILTER_SCROLL_OFFSET]);

  useEffect(() => {
    const currentUserId = user?.id ?? null;

    if (!hasHandledInitialAuthSyncRef.current) {
      hasHandledInitialAuthSyncRef.current = true;

      if (currentUserId === initialUserId) {
        return;
      }
    }

    void mutate(swrKey);
    // Entitlement state changes with auth identity, so refresh the active page only when identity truly changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUserId, mutate, user?.id]);

  useEffect(() => {
    if (!visibleData || filters.page >= visibleData.totalPages) {
      return;
    }

    const nextPageKey = [
      "mock-tests",
      filters.stream,
      filters.category,
      filters.page + 1,
    ] as const;

    void mutate(nextPageKey, fetchMockTests(nextPageKey), {
      populateCache: true,
      revalidate: false,
    });
  }, [
    filters.page,
    filters.stream,
    mutate,
    filters.category,
    visibleData,
  ]);

  useEffect(() => {
    if (!visibleData?.tests.length) {
      return;
    }

    visibleData.tests.forEach((test) => {
      router.prefetch(`/mock-tests/${test.id}`);
    });
  }, [router, visibleData]);

  const resetFilters = () => {
    applyState({ stream: filters.stream, category: "all", page: 1 });
  };

  const handlePageChange = (nextPage: number) => {
    if (!visibleData || isPageTransitioning || nextPage === filters.page) {
      return;
    }

    pendingScrollPageRef.current = nextPage;
    scrollToFilters("smooth");
    applyState({
      ...filters,
      page: nextPage,
    });
  };

  const closePurchaseModal = () => {
    if (purchasingTestId) {
      return;
    }

    setSelectedTest(null);
  };

  const markMockAsPurchased = async (testId: string) => {
    await mutate(
      swrKey,
      (current?: MockTestsBootstrapResponse) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          tests: current.tests.map((test) =>
            test.id === testId
              ? {
                  ...test,
                  isPurchased: true,
                  canAccess: true,
                }
              : test,
          ),
        };
      },
      {
        revalidate: false,
        populateCache: true,
      },
    );
  };

  const handlePurchaseClick = (test: MockTest) => {
    setFeedback(null);

    if (isAuthLoading) {
      return;
    }

    if (!user) {
      router.push("/auth");
      return;
    }

    setSelectedTest(test);
  };

  const handleCheckout = async () => {
    if (!selectedTest) {
      return;
    }

    try {
      if (!user) {
        router.push("/auth");
        return;
      }

      setPurchasingTestId(selectedTest.id);
      setFeedback(null);

      const scriptLoaded = await loadRazorpayCheckoutScript();

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error(CHECKOUT_ERROR_MESSAGE);
      }

      const orderResult = await fetch("/api/payments/mock-tests/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testId: selectedTest.id,
        }),
      }).then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | CheckoutOrderResponse
          | null;

        return {
          ok: response.ok,
          status: response.status,
          payload,
        };
      });

      if (!orderResult.ok || !orderResult.payload?.orderId) {
        throw new Error(
          orderResult.payload?.error || getCheckoutErrorMessage(orderResult.status),
        );
      }

      const orderPayload = orderResult.payload;
      const checkout = new window.Razorpay({
        key: orderPayload.keyId,
        amount: orderPayload.amount,
        currency: orderPayload.currency,
        name: "UniPrep",
        image: `${window.location.origin}/logo.svg`,
        description: orderPayload.testTitle,
        order_id: orderPayload.orderId,
        prefill: {
          name: user.user_metadata?.display_name || "",
          email: user.email || "",
          contact: profile?.phone || "",
        },
        notes: {
          test_id: orderPayload.testId,
          test_title: orderPayload.testTitle,
          purchase_type: "mock_test",
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: () => {
            setPurchasingTestId(null);
          },
        },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            const verifyResponse = await fetch("/api/payments/mock-tests/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                testId: selectedTest.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyPayload = (await verifyResponse.json().catch(() => null)) as
              | VerifyPaymentResponse
              | null;

            if (!verifyResponse.ok || !verifyPayload?.success) {
              throw new Error(getVerifyErrorMessage(verifyResponse.status));
            }

            await markMockAsPurchased(selectedTest.id);
            setSelectedTest(null);
            setFeedback({
              type: "success",
              message: `${selectedTest.title} is now unlocked.`,
            });
          } catch (checkoutError) {
            const message =
              checkoutError instanceof Error
                ? checkoutError.message
                : VERIFY_ERROR_MESSAGE;

            setFeedback({
              type: "error",
              message,
            });
          } finally {
            setPurchasingTestId(null);
          }
        },
      });

      checkout.open();
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error
          ? checkoutError.message
          : CHECKOUT_ERROR_MESSAGE;

      setFeedback({
        type: "error",
        message,
      });
      setPurchasingTestId(null);
    }
  };

  const renderPrimaryAction = (test: MockTest) => {
    if (test.hasReachedAttemptLimit) {
      return (
        <button
          type="button"
          disabled
          className="inline-block cursor-not-allowed rounded-xl border border-slate-300 bg-slate-200 px-4 py-2 text-slate-600"
        >
          Attempt Limit Reached
        </button>
      );
    }

    if (test.canAccess) {
      return (
        <Link
          href={`/mock-tests/${test.id}`}
          prefetch
          className="inline-block rounded-xl border border-black bg-emerald-300 px-4 py-2 text-black transition hover:bg-emerald-400"
        >
          {test.attemptCount >= 1
            ? "Reattempt"
            : test.hasFreeMockAvailable && !test.hasSubscriptionAccess && !test.isPurchased
              ? "Start Free Mock"
            : "Start Test"}
        </Link>
      );
    }

    if (!user) {
      return (
        <button
          type="button"
          onClick={() => router.push("/auth")}
          className="inline-block rounded-xl border border-black bg-slate-100 px-4 py-2 text-black transition hover:bg-slate-200"
        >
          Sign In
        </button>
      );
    }

    if (ENABLE_SINGLE_MOCK_PURCHASES) {
      return (
        <button
          type="button"
          onClick={() => handlePurchaseClick(test)}
          disabled={purchasingTestId !== null}
          className="inline-block rounded-xl border border-black bg-sky-200 px-4 py-2 text-black transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {purchasingTestId === test.id ? "Starting checkout..." : "Unlock With Plan"}
        </button>
      );
    }

    return (
      <Link
        href="/#pricing"
        className="inline-block rounded-xl border border-black bg-sky-200 px-4 py-2 text-black transition hover:bg-sky-300"
      >
        Unlock With Plan
      </Link>
    );
  };

  return (
    <>
      {feedback ? (
        <div className="fixed right-4 top-24 z-50 w-[calc(100%-2rem)] max-w-sm">
          <div
            className={`rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50/95 text-emerald-800"
                : "border-rose-200 bg-rose-50/95 text-rose-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <p className="flex-1 text-sm font-medium">{feedback.message}</p>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="rounded-full p-1 transition-colors hover:bg-black/5"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {access ? (
        <section
          ref={filterSectionRef}
          className="mb-8 rounded-3xl border border-neutral-100 bg-white p-4 shadow-sm sm:p-6"
        >
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-black">Stream:</span>
              {access.isSubscriber ? (
                <span className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
                  {access.baseStreamLabel}
                </span>
              ) : (
                access.selectableMainStreams.map((stream) => (
                  <FilterTab
                    key={stream}
                    active={filters.stream === stream}
                    disabled={isResultsTransitioning}
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

            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-3 pb-1">
                <span className="text-sm font-medium text-black">Subject:</span>
                <select
                  value={filters.category}
                  disabled={isResultsTransitioning}
                  onChange={(event) =>
                    applyState({
                      ...filters,
                      category: event.target.value,
                      page: 1,
                    })
                  }
                  className="cursor-pointer rounded-md border border-black bg-blue-300 px-2 py-2 text-xs focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                >
                  {allFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={resetFilters}
                disabled={filters.category === "all" || isResultsTransitioning}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>

          {!access.isSubscriber ? (
            <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
              {user
                ? visibleData?.tests.some((test) => test.hasFreeMockAvailable)
                  ? "You can use one free mock on a single subject, with up to 2 attempts on that chosen mock."
                  : "Your one free mock is locked to a single subject. Other subjects require a subscription plan."
                : "Sign in to unlock one free mock on a single subject, with up to 2 attempts."}
            </div>
          ) : null}
        </section>
      ) : null}

      {shouldShowLoadingState ? (
        <div className="flex min-h-[18rem] items-center justify-center rounded-3xl bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4">
          <Loader
            title="Loading mock tests"
            subtitle="Pulling the latest mocks for you."
          />
        </div>
      ) : null}

      {shouldShowErrorState ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-700">
          <p className="text-lg font-semibold">We could not load these mocks.</p>
          <p className="mt-2 text-sm">
            {error.message || "Please try a different filter combination."}
          </p>
        </div>
      ) : null}

      {!shouldShowLoadingState && !shouldShowErrorState && visibleData ? (
        <div className="relative">
          <div
            className={`transition-all duration-200 ease-out ${
              isResultsTransitioning
                ? "pointer-events-none translate-y-1 opacity-70"
                : "translate-y-0 opacity-100"
            }`}
          >
          {visibleData.tests.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visibleData.tests.map((test) => (
                <div
                  key={test.id}
                  className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <Image
                    src="/assets/nta.jpeg"
                    alt="NTA"
                    width={64}
                    height={64}
                    className="pointer-events-none absolute right-3 top-3 h-16 w-16 select-none opacity-50"
                  />

                  <div className="mb-2 flex gap-2">
                    {test.stream ? (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                        {toDisplayLabel(test.stream)}
                      </span>
                    ) : null}
                    {test.subject ? (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        {toDisplayLabel(test.subject)}
                      </span>
                    ) : null}
                    {test.isPurchased && !test.hasSubscriptionAccess ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                        Purchased
                      </span>
                    ) : null}
                    {test.hasFreeMockAvailable && !test.hasSubscriptionAccess ? (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                        Free Mock
                      </span>
                    ) : null}
                    {test.attemptCount >= 1 ? (
                      <span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-medium text-violet-800">
                        Attempt {Math.min(test.attemptCount, 2)} / 2
                      </span>
                    ) : null}
                  </div>

                  <h2 className="text-xl font-semibold text-neutral-900">
                    {test.title}
                  </h2>

                  <div className="my-4 flex justify-between text-sm text-neutral-600">
                    <span>{test.duration_minutes} mins</span>
                    <span>Total Marks: {test.total_marks}</span>
                  </div>

                  <div className="mb-0.5 text-xs text-neutral-500">Year: {test.year}</div>

                  <div className="mb-0.5 min-h-[1.5rem] text-sm font-medium">
                    {test.hasReachedAttemptLimit ? (
                      null
                    ) : test.hasSubscriptionAccess ? null : test.isPurchased ? (
                      <span className="text-emerald-700">Purchased access available</span>
                    ) : ENABLE_SINGLE_MOCK_PURCHASES ? (
                      <span className="text-neutral-800">
                        Entry Fee: Rs. {getDisplayPriceRupees(test.singleMockPricePaise)}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-auto pt-0">
                    {renderPrimaryAction(test)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-600">
              No mock tests found for the selected filters.
            </div>
          )}

          {visibleData.totalPages > 1 ? (
            <div className="mt-10 flex justify-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-3 shadow-sm">
                <button
                  type="button"
                  onClick={() => handlePageChange(Math.max(filters.page - 1, 1))}
                  disabled={displayedPage === 1 || isPageTransitioning}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from(
                  { length: visibleData.totalPages },
                  (_, index) => index + 1,
                ).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => handlePageChange(pageNumber)}
                    disabled={isPageTransitioning}
                    className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition ${
                      displayedPage === pageNumber
                        ? "border bg-emerald-300 text-black shadow-lg shadow-slate-900/20"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    handlePageChange(Math.min(filters.page + 1, visibleData.totalPages))
                  }
                  disabled={
                    displayedPage === visibleData.totalPages || isPageTransitioning
                  }
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
          </div>

          {isResultsTransitioning ? (
            <div className="pointer-events-none fixed inset-0 z-40 bg-white/35" />
          ) : null}
        </div>
      ) : null}

      {ENABLE_SINGLE_MOCK_PURCHASES && selectedTest ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-sky-600">
                  Single Mock Purchase
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-black">
                  {selectedTest.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={closePurchaseModal}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-black"
                aria-label="Close purchase modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Mock Access</span>
                <span>One test only</span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Payable Amount
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-black">
                    Rs. {getDisplayPriceRupees(selectedTest.singleMockPricePaise)}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                  Exact mock unlock
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              Choose whether you want to unlock only this mock, or go for the
              full subscription plan for broader access.
            </p>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={purchasingTestId !== null}
                className="flex-1 rounded-2xl border border-black bg-emerald-300 px-4 py-3 font-medium text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {purchasingTestId === selectedTest.id
                  ? "Opening checkout..."
                  : `Buy This Mock for Rs. ${getDisplayPriceRupees(
                      selectedTest.singleMockPricePaise,
                    )}`}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedTest(null);
                  router.push("/#pricing");
                }}
                disabled={purchasingTestId !== null}
                className="flex-1 rounded-2xl border border-black bg-sky-200 px-4 py-3 font-medium text-black transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Buy Subscription Plan
              </button>

              <button
                type="button"
                onClick={closePurchaseModal}
                disabled={purchasingTestId !== null}
                className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
