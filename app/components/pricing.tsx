"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaCheck } from "react-icons/fa6";
import { PLAN_CATALOG, type PlanDefinition, type PlanId } from "@/lib/plans";
import { X } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import {
  STREAM_OPTIONS,
  type StreamKey,
  getDisplayPriceRupees,
  getPlanCheckoutAmountPaise,
  isGatIncludedInPlan,
  normalizeIncludeGat,
} from "@/lib/subscriptions";

type CheckoutOrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  planId: PlanId;
  planName: string;
  stream: StreamKey;
  includeGat: boolean;
};

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type VerifyPaymentResponse = {
  success?: boolean;
  error?: string;
  planId?: PlanId;
  paymentStatus?: string;
};

type SubscriptionStatusResponse = {
  planId?: PlanId | null;
  paymentStatus?: string | null;
};

type RazorpayInstance = {
  open: () => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let razorpayScriptPromise: Promise<boolean> | null = null;
const CHECKOUT_ERROR_MESSAGE =
  "We couldn't start checkout right now. Please try again in a moment.";
const VERIFY_ERROR_MESSAGE =
  "We couldn't confirm your payment right now. If money was deducted, please contact support.";
const AUTH_ERROR_MESSAGE = "Please sign in and try again.";

function loadRazorpayCheckoutScript() {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

function getCheckoutErrorMessage(status?: number) {
  if (status === 401) {
    return AUTH_ERROR_MESSAGE;
  }

  if (status === 400) {
    return "Please review your selection and try again.";
  }

  return CHECKOUT_ERROR_MESSAGE;
}

function getVerifyErrorMessage(status?: number) {
  if (status === 401) {
    return AUTH_ERROR_MESSAGE;
  }

  if (status === 400) {
    return "Your payment could not be verified. Please try again or contact support.";
  }

  return VERIFY_ERROR_MESSAGE;
}

export default function Pricing() {
  const router = useRouter();
  const { user, profile, isAuthLoading } = useAuth();
  const [loadingPlanId, setLoadingPlanId] = useState<PlanId | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanDefinition | null>(null);
  const [selectedStream, setSelectedStream] = useState<StreamKey | null>(null);
  const [includeGat, setIncludeGat] = useState(false);
  const [purchasedPlanId, setPurchasedPlanId] = useState<PlanId | null>(null);
  const [purchasedPaymentStatus, setPurchasedPaymentStatus] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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
    if (!user) {
      setPurchasedPlanId(null);
      setPurchasedPaymentStatus(null);
      return;
    }

    const loadSubscriptionStatus = async () => {
      const response = await fetch("/api/payments/subscription-status", {
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => null)) as
        | SubscriptionStatusResponse
        | null;

      if (!response.ok || !payload) {
        return;
      }

      setPurchasedPlanId((payload.planId as PlanId | null) || null);
      setPurchasedPaymentStatus(payload.paymentStatus || null);
    };

    void loadSubscriptionStatus();
  }, [user]);

  const currentUser = user;
  const profilePhone = profile?.phone || "";
  const activePlanId = purchasedPlanId || (profile?.plan_id as PlanId | null) || null;
  const paymentStatus = purchasedPaymentStatus || profile?.payment_status || null;
  const isSelectionOpen = selectedPlan !== null;
  const normalizedIncludeGat = selectedPlan
    ? normalizeIncludeGat(selectedPlan.id, includeGat)
    : false;
  const selectedAmountPaise = selectedPlan && selectedStream
    ? getPlanCheckoutAmountPaise(selectedPlan.id, normalizedIncludeGat)
    : 0;

  const getDisplayedPlanPrice = (planId: PlanId) =>
    getDisplayPriceRupees(
      getPlanCheckoutAmountPaise(planId, isGatIncludedInPlan(planId)),
    );

  const getDisplayedStrikePrice = (plan: PlanDefinition) =>
    plan.id === "basic" ? "Rs. 999" : plan.strikeThrough.replace("Rs. ", "Rs. ");

  const getPlanCardSubjects = (planId: PlanId) =>
    planId === "basic" ? "Domain + English" : "Domain + English + GAT";

  const formatStrikePrice = (plan: PlanDefinition) =>
    getDisplayedStrikePrice(plan).replace("Rs. ", `Rs. `);

  const isPlanPurchased = (planId: PlanId) =>
    paymentStatus === "verified" && activePlanId === planId;

  const closeSelectionBox = () => {
    setSelectedPlan(null);
    setSelectedStream(null);
    setIncludeGat(false);
  };

  const handlePurchaseClick = (plan: PlanDefinition) => {
    if (isPlanPurchased(plan.id)) {
      return;
    }

    setFeedback(null);

    if (isAuthLoading) {
      return;
    }

    if (!currentUser) {
      router.push("/auth");
      return;
    }

    setSelectedPlan(plan);
    setSelectedStream(null);
    setIncludeGat(false);
  };

  const handleCheckout = async () => {
    if (!selectedPlan || !selectedStream) {
      return;
    }

    setFeedback(null);

    try {
      if (!currentUser) {
        router.push("/auth");
        return;
      }

      setLoadingPlanId(selectedPlan.id);

      const scriptLoaded = await loadRazorpayCheckoutScript();

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error(CHECKOUT_ERROR_MESSAGE);
      }

      const orderResult = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          stream: selectedStream,
          includeGat: normalizedIncludeGat,
        }),
      }).then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | (CheckoutOrderResponse & { error?: string })
          | { error?: string }
          | null;

        return {
          ok: response.ok,
          status: response.status,
          payload,
        };
      });

      if (!orderResult.ok || !orderResult.payload || !("orderId" in orderResult.payload)) {
        throw new Error(getCheckoutErrorMessage(orderResult.status));
      }

      const orderPayload = orderResult.payload;
      closeSelectionBox();

      const checkout = new window.Razorpay({
        key: orderPayload.keyId,
        amount: orderPayload.amount,
        currency: orderPayload.currency,
        name: "UniPrep",
        image: `${window.location.origin}/logo.svg`,
        description: orderPayload.planName,
        order_id: orderPayload.orderId,
        prefill: {
          name: currentUser.user_metadata?.display_name || "",
          email: currentUser.email || "",
          contact: profilePhone,
        },
        notes: {
          plan_id: orderPayload.planId,
          plan_name: orderPayload.planName,
          stream: orderPayload.stream,
          include_gat: String(orderPayload.includeGat),
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: () => {
            setLoadingPlanId(null);
          },
        },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            const verifyResponse = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                planId: selectedPlan.id,
                stream: selectedStream,
                includeGat: normalizedIncludeGat,
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

            setPurchasedPlanId((verifyPayload.planId as PlanId | undefined) || selectedPlan.id);
            setPurchasedPaymentStatus(verifyPayload.paymentStatus || "verified");

            setFeedback({
              type: "success",
              message: `${selectedPlan.planType} plan activated successfully.`,
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : VERIFY_ERROR_MESSAGE;

            setFeedback({
              type: "error",
              message,
            });
          } finally {
            setLoadingPlanId(null);
          }
        },
      });

      checkout.open();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : CHECKOUT_ERROR_MESSAGE;

      setFeedback({
        type: "error",
        message,
      });
      setLoadingPlanId(null);
    }
  };

  return (
    <main id="pricing" className="max-w-6xl py-12 mx-auto px-4 scroll-mt-24">
      {feedback ? (
        <div className="fixed right-4 top-24 z-50 w-[calc(100%-2rem)] max-w-sm">
          <div
            className={`rounded-2xl border shadow-lg backdrop-blur-sm px-4 py-3 ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50/95 text-emerald-800"
                : "border-rose-200 bg-rose-50/95 text-rose-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{feedback.message}</p>
              </div>
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

      <div className="flex flex-col gap-2 justify-center items-center">
        <span className="text-3xl md:text-4xl font-semibold text-center">
          Choose Your Plan
        </span>
        <h1 className="text-base md:text-lg text-center max-w-xl px-4">
          India{"'"}s first CUET program that prepares you for both the exam and
          your college life.
        </h1>
      </div>

      <div className="flex flex-col md:flex-row md:flex-wrap gap-6 justify-center py-12 px-4">
        {PLAN_CATALOG.map((plan) => (
          <div key={plan.id}>
            {plan.highlight ? (
              <div className="relative p-0.5 bg-linear-to-br from-neutral-200 via-neutral-300 to-neutral-200 rounded-2xl hover:scale-105 duration-300">
                <div className="flex flex-col gap-2 items-center justify-center w-full sm:w-sm md:w-xs bg-neutral-50 rounded-2xl">
                  <span className="text-xs bg-emerald-400 mt-8 px-6 uppercase py-2 rounded-full border">
                    {plan.planType}
                  </span>
                  <div className="flex flex-col px-6 py-1 leading-none">
                    <span className="line-through text-sm text-neutral-500">
                      {formatStrikePrice(plan)}
                    </span>
                    <span className="text-4xl">
                      {`Rs. ${getDisplayedPlanPrice(plan.id)}`}
                      <span className="font-light text-xl"></span>
                    </span>
                  </div>
                  <span className="text-lg px-6">{plan.name}</span>
                  <span className="text-center text-sm text-neutral-700 px-6">
                    {plan.description}
                  </span>
                  <div className="px-6 my-4 w-full">
                    <button
                      type="button"
                      onClick={() => handlePurchaseClick(plan)}
                      disabled={isAuthLoading || loadingPlanId !== null || isPlanPurchased(plan.id)}
                      className="w-full flex items-center justify-center bg-purple-300 rounded-full text-lg py-2 border cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loadingPlanId === plan.id
                        ? "Processing..."
                        : isPlanPurchased(plan.id)
                          ? "Purchased"
                          : "Pay Now"}
                    </button>
                  </div>
                  <span className="w-full text-left px-8 text-md">Features :</span>
                  <ul className="text-sm flex flex-col items-start pb-4 px-6">
                    {plan.includes.map((feature) => (
                      <li key={feature} className="flex gap-2 items-center">
                        <FaCheck />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="bg-black w-full flex items-center justify-center py-2 rounded-b-2xl">
                    <span className="text-xs text-neutral-400">
                      Early Batch Price. Limited Seats
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 bg-white rounded-2xl border border-neutral-300 hover:scale-105 duration-300 items-center justify-center w-full sm:w-sm md:w-xs">
                <span className="text-xs bg-emerald-400 mt-8 px-6 uppercase py-2 rounded-full border">
                  {plan.planType}
                </span>
                <div className="flex flex-col px-6 py-1 leading-none">
                  <span className="line-through text-sm text-neutral-500">
                    {formatStrikePrice(plan)}
                  </span>
                  <span className="text-4xl">
                    {`Rs. ${getDisplayedPlanPrice(plan.id)}`}
                    <span className="font-light text-xl"></span>
                  </span>
                </div>
                <span className="text-lg px-6">{plan.name}</span>
                <span className="text-center text-sm text-neutral-700 px-6">
                  {plan.description}
                </span>
                <div className="px-6 my-4 w-full">
                    <button
                      type="button"
                      onClick={() => handlePurchaseClick(plan)}
                      disabled={isAuthLoading || loadingPlanId !== null || isPlanPurchased(plan.id)}
                      className="w-full flex items-center justify-center border text-lg rounded-full py-2 bg-blue-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                    >
                    {loadingPlanId === plan.id
                      ? "Processing..."
                      : isPlanPurchased(plan.id)
                        ? "Purchased"
                        : "Pay Now"}
                  </button>
                </div>
                <span className="w-full text-left px-8 text-md">Features :</span>
                <ul className="text-sm px-8 w-full flex flex-col items-start pb-4">
                  {plan.includes.map((feature) => (
                    <li key={feature} className="flex gap-2 items-center">
                      <FaCheck />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {isSelectionOpen && selectedPlan ? (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 px-4 py-6">
          <div
            className="absolute inset-0"
            onClick={closeSelectionBox}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-3xl rounded-[28px] border border-neutral-200 bg-white p-5 shadow-2xl md:p-6">
            <button
              type="button"
              onClick={closeSelectionBox}
              className="absolute right-4 top-4 rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              aria-label="Close stream selection"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1.5 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.32em] text-neutral-500">
                Choose your stream
              </p>
              <h2 className="text-xl font-semibold text-neutral-900 md:text-2xl">
                Pick the stream for your {selectedPlan.planType} plan
              </h2>
            </div>

            <div className="mt-6 flex flex-row gap-3 overflow-x-auto pb-2">
              {STREAM_OPTIONS.map((stream) => {
                const isSelected = selectedStream === stream.key;

                return (
                  <button
                    key={stream.key}
                    type="button"
                    onClick={() => setSelectedStream(stream.key)}
                    className={`min-w-45 flex-1 rounded-2xl border px-4 py-4 text-left transition-all ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 shadow-sm"
                        : "border-neutral-200 bg-neutral-50 hover:border-neutral-300 hover:bg-neutral-100"
                    }`}
                  >
                    <p className="text-base font-semibold text-neutral-900 md:text-lg">
                      {stream.label}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500 line-through md:text-sm">
                      {formatStrikePrice(selectedPlan)}
                    </p>
                    <p className="mt-0.5 text-xl font-bold text-neutral-900 md:text-2xl">
                      Rs. {getDisplayPriceRupees(
                        getPlanCheckoutAmountPaise(selectedPlan.id, selectedPlan.id !== "basic"),
                      )}
                    </p>
                    <p className="mt-1.5 text-xs text-neutral-600 md:text-sm">
                      {getPlanCardSubjects(selectedPlan.id)}
                    </p>
                  </button>
                );
              })}
            </div>

            {selectedPlan.id === "basic" ? (
              <div className="mt-6 space-y-3">
                <p className="text-center text-xs font-medium uppercase tracking-[0.32em] text-neutral-500">
                  Add General Aptitude Test
                </p>
                <button
                  type="button"
                  onClick={() => setIncludeGat((current) => !current)}
                  className={`mx-auto flex w-full max-w-sm items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-all ${
                    includeGat
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-neutral-200 bg-neutral-50 hover:border-neutral-300 hover:bg-neutral-100"
                  }`}
                >
                  <div>
                    <p className="text-base font-semibold text-neutral-900">GAT</p>
                    <p className="text-xs text-neutral-600 md:text-sm">Optional add-on for Basic</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-neutral-900 md:text-xl">Rs. 199</p>
                    <p className="text-xs text-neutral-600 md:text-sm">
                      {includeGat ? "Selected" : "Optional"}
                    </p>
                  </div>
                </button>
              </div>
            ) : null}

            <div className="mt-6 flex justify-between items-center gap-3 border-t border-neutral-200 pt-5">
              {selectedStream ? (
                <div>
                  <p className="text-md text-neutral-500">
                    Total
                  </p>
                  <p className="text-lg font-bold text-neutral-900 md:text-3xl">
                    Rs. {getDisplayPriceRupees(selectedAmountPaise)} Only
                  </p>
                </div>
              ) : null}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={!selectedStream || loadingPlanId !== null}
                className="rounded-full bg-emerald-300 border px-7 py-3 text-sm font-semibold text-black shadow-lg transition hover:scale-[1.02] hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60 md:text-base"
              >
                {loadingPlanId === selectedPlan.id
                  ? "Processing..."
                  : "Proceed to Checkout"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
