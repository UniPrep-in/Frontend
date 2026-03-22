"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaCheck } from "react-icons/fa6";
import { createClient } from "@/lib/supabase/client";
import { PLAN_CATALOG, type PlanDefinition, type PlanId } from "@/lib/plans";
import { X } from "lucide-react";
import type { User } from "@supabase/supabase-js";

type CheckoutOrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  planId: PlanId;
  planName: string;
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

export default function Pricing() {
  const router = useRouter();
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingPlanId, setLoadingPlanId] = useState<PlanId | null>(null);
  const [profilePhone, setProfilePhone] = useState("");
  const [activePlanId, setActivePlanId] = useState<PlanId | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const loadPurchaseState = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUser(user ?? null);

      if (!user) {
        setProfilePhone("");
        setActivePlanId(null);
        setPaymentStatus(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, plan_id, payment_status")
        .eq("id", user.id)
        .maybeSingle();

      setProfilePhone(profile?.phone || "");
      setActivePlanId((profile?.plan_id as PlanId | null) || null);
      setPaymentStatus(profile?.payment_status || null);
    };

    void loadPurchaseState();
  }, [supabase]);

  useEffect(() => {
    void loadRazorpayCheckoutScript();
  }, []);

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

  const isPlanPurchased = (planId: PlanId) =>
    paymentStatus === "verified" && activePlanId === planId;

  const handlePurchase = async (plan: PlanDefinition) => {
    if (isPlanPurchased(plan.id)) {
      return;
    }

    setFeedback(null);
    setLoadingPlanId(plan.id);

    try {
      if (!currentUser) {
        setLoadingPlanId(null);
        router.push("/auth");
        return;
      }

      const [scriptLoaded, orderResult] = await Promise.all([
        loadRazorpayCheckoutScript(),
        fetch("/api/payments/razorpay/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ planId: plan.id }),
        }).then(async (response) => {
          const payload = (await response.json().catch(() => null)) as
            | (CheckoutOrderResponse & { error?: string })
            | { error?: string }
            | null;

          return {
            ok: response.ok,
            payload,
          };
        }),
      ]);

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay checkout");
      }

      if (!orderResult.ok || !orderResult.payload || !("orderId" in orderResult.payload)) {
        throw new Error(orderResult.payload?.error || "Unable to initialize payment");
      }

      const orderPayload = orderResult.payload;

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
                planId: plan.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyPayload = (await verifyResponse.json().catch(() => null)) as
              | VerifyPaymentResponse
              | null;

            if (!verifyResponse.ok || !verifyPayload?.success) {
              throw new Error(verifyPayload?.error || "Payment verification failed");
            }

            setActivePlanId((verifyPayload.planId as PlanId | undefined) || plan.id);
            setPaymentStatus(verifyPayload.paymentStatus || "verified");

            setFeedback({
              type: "success",
              message: `${plan.planType} plan activated successfully.`,
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Payment verification failed";

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
        error instanceof Error ? error.message : "Unable to start payment";

      setFeedback({
        type: "error",
        message,
      });
      setLoadingPlanId(null);
    }
  };

  return (
    <main className="max-w-6xl py-12 mx-auto px-4">
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
                  <div className="flex flex-col px-6 py-2">
                    <span className="line-through text-sm">{plan.strikeThrough}</span>
                    <span className="text-4xl">
                      {plan.pricing}
                      <span className="font-light text-xl">/mo</span>
                    </span>
                  </div>
                  <span className="text-lg px-6">{plan.name}</span>
                  <span className="text-center text-sm text-neutral-700 px-6">
                    {plan.description}
                  </span>
                  <div className="px-6 my-4 w-full">
                    <button
                      type="button"
                      onClick={() => handlePurchase(plan)}
                      disabled={loadingPlanId !== null || isPlanPurchased(plan.id)}
                      className="w-full flex items-center justify-center bg-purple-300 rounded-full text-lg py-2 border disabled:cursor-not-allowed disabled:opacity-60"
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
                <div className="flex flex-col px-6 py-2">
                  <span className="line-through text-sm">{plan.strikeThrough}</span>
                  <span className="text-4xl">
                    {plan.pricing}
                    <span className="font-light text-xl">/mo</span>
                  </span>
                </div>
                <span className="text-lg px-6">{plan.name}</span>
                <span className="text-center text-sm text-neutral-700 px-6">
                  {plan.description}
                </span>
                <div className="px-6 my-4 w-full">
                  <button
                    type="button"
                    onClick={() => handlePurchase(plan)}
                    disabled={loadingPlanId !== null || isPlanPurchased(plan.id)}
                    className="w-full flex items-center justify-center border text-lg rounded-full py-2 bg-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
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
    </main>
  );
}
