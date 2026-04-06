"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";
import type { MockTest, MockTestsPageResponse } from "@/lib/mock-tests-data";
import {
  loadRazorpayCheckoutScript,
  type RazorpaySuccessResponse,
} from "@/lib/razorpay-checkout";
import { useAuth } from "@/providers/AuthProvider";
import {
  type ContentCategory,
  getDisplayPriceRupees,
  type MainStreamLabel,
  type SubscriptionAccess,
} from "@/lib/subscriptions";

type MockTestsClientProps = {
  access: SubscriptionAccess;
  subjectOptionsByStream: Record<MainStreamLabel, string[]>;
  initialMockTestsData: MockTestsPageResponse;
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

function normalizeInitialCategory(
  value: string | undefined,
  access: SubscriptionAccess,
  subjects: string[],
): string {
  if (value === "all" || value === "english" || value === "gat") {
    if (access.allowedCategories.includes(value as ContentCategory)) {
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

function getRequestParams(category: string, subjects: string[]) {
  if (subjects.includes(category)) {
    return {
      category: "main" as const,
      subject: category,
    };
  }

  return {
    category: category as ContentCategory,
    subject: "",
  };
}

async function fetchMockTests([, stream, category, subject, page]: readonly [
  string,
  MainStreamLabel,
  ContentCategory,
  string,
  number,
]) {
  const params = new URLSearchParams();
  params.set("stream", stream.toLowerCase());
  params.set("category", category);

  if (subject) {
    params.set("subject", subject);
  }

  params.set("page", String(page));
  const response = await fetch(`/api/mock-tests?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
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
  access,
  subjectOptionsByStream,
  initialMockTestsData,
  initialParams,
}: MockTestsClientProps) {
  const router = useRouter();
  const { user, profile, isAuthLoading } = useAuth();
  const { mutate } = useSWRConfig();
  const pathname = "/mock-tests";
  const initialStream = normalizeStreamLabel(initialParams.stream, access);
  const availableSubjects = subjectOptionsByStream[initialStream] ?? [];
  const initialPage = parsePage(initialParams.page);
  const initialCategory = normalizeInitialCategory(
    initialParams.category,
    access,
    availableSubjects,
  );
  const [filters, setFilters] = useState<FilterState>({
    stream: initialStream,
    category: initialCategory,
    page: initialPage,
  });
  const [selectedTest, setSelectedTest] = useState<MockTest | null>(null);
  const [purchasingTestId, setPurchasingTestId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const currentSubjects = subjectOptionsByStream[filters.stream] ?? [];
  const requestParams = getRequestParams(filters.category, currentSubjects);
  const initialRequestParams = getRequestParams(initialCategory, availableSubjects);
  const swrKey = [
    "mock-tests",
    filters.stream,
    requestParams.category,
    requestParams.subject,
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

  const applyState = (nextState: FilterState) => {
    setFilters(nextState);
    window.history.pushState(null, "", buildUrl(pathname, nextState));
  };

  const allFilterOptions: {
    type: "category" | "subject";
    value: string;
    label: string;
  }[] = [
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
  ];

  const { data, error, isLoading, isValidating } = useSWR(swrKey, fetchMockTests, {
    fallbackData:
      filters.stream === initialStream &&
      filters.page === initialPage &&
      requestParams.category === initialRequestParams.category &&
      requestParams.subject === initialRequestParams.subject
        ? initialMockTestsData
        : undefined,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  });

  const hasMatchingPageData = data?.currentPage === filters.page;
  const visibleData = hasMatchingPageData ? data : undefined;
  const isInitialLoading = !error && (!visibleData || (isLoading && !hasMatchingPageData));
  const isRefreshing = Boolean(visibleData) && isValidating;

  useEffect(() => {
    void mutate(swrKey);
    // Entitlement state changes with auth identity, so refresh the active page on sign-in/out.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mutate, user?.id]);

  useEffect(() => {
    if (!visibleData || filters.page >= visibleData.totalPages) {
      return;
    }

    const nextPageKey = [
      "mock-tests",
      filters.stream,
      requestParams.category,
      requestParams.subject,
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
    requestParams.category,
    requestParams.subject,
    visibleData,
  ]);

  const resetFilters = () => {
    applyState({ stream: filters.stream, category: "all", page: 1 });
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
      (current?: MockTestsPageResponse) => {
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
    if (test.canAccess) {
      return (
        <Link
          href={`/mock-tests/${test.id}`}
          prefetch
          className="inline-block rounded-xl border border-black bg-emerald-300 px-4 py-2 text-black transition hover:bg-emerald-400"
        >
          {test.hasFreeMockAvailable && !test.hasSubscriptionAccess && !test.isPurchased
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

      <section className="mb-8 rounded-3xl border border-neutral-100 bg-white p-4 shadow-sm sm:p-6">
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
                onChange={(event) =>
                  applyState({
                    ...filters,
                    category: event.target.value,
                    page: 1,
                  })
                }
                className="cursor-pointer rounded-md border border-black bg-blue-300 px-2 py-2 text-xs focus:outline-none sm:text-sm"
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
              disabled={filters.category === "all"}
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
                ? "Your account can start one mock for free. After that, a subscription plan is required."
                : "Your free mock has been used. Buy a subscription plan to continue with more mocks."
              : "Sign in to use your one free mock, then upgrade to a subscription plan for full access."}
          </div>
        ) : null}
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

      {!isInitialLoading && !error && visibleData ? (
        <>
          {isRefreshing ? (
            <div className="mb-4 flex justify-end">
              <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Refreshing
              </span>
            </div>
          ) : null}

          {visibleData.tests.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visibleData.tests.map((test) => (
                <div
                  key={test.id}
                  className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md"
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
                    {test.hasSubscriptionAccess ? (
                      <span className="rounded-full bg-neutral-900 px-2 py-1 text-xs font-medium text-white">
                        Plan Access
                      </span>
                    ) : null}
                    {test.hasFreeMockAvailable && !test.hasSubscriptionAccess ? (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                        1 Free Mock
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

                  <div className="mb-2 text-xs text-neutral-500">Year: {test.year}</div>

                  <div className="mb-4 text-sm font-medium">
                    {test.hasSubscriptionAccess ? (
                      <span className="text-emerald-700">Ready to start</span>
                    ) : test.isPurchased ? (
                      <span className="text-emerald-700">Purchased access available</span>
                    ) : test.hasFreeMockAvailable ? (
                      <span className="text-amber-700">Use your one free mock on this test</span>
                    ) : ENABLE_SINGLE_MOCK_PURCHASES ? (
                      <span className="text-neutral-800">
                        Entry Fee: Rs. {getDisplayPriceRupees(test.singleMockPricePaise)}
                      </span>
                    ) : (
                      <span className="text-neutral-800">Plan required after your free mock</span>
                    )}
                  </div>

                  {renderPrimaryAction(test)}
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
                  { length: visibleData.totalPages },
                  (_, index) => index + 1,
                ).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => applyState({ ...filters, page: pageNumber })}
                    className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition ${
                      filters.page === pageNumber
                        ? "border bg-emerald-300 text-black shadow-lg shadow-slate-900/20"
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
                      page: Math.min(filters.page + 1, visibleData.totalPages),
                    })
                  }
                  disabled={filters.page === visibleData.totalPages}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </>
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
