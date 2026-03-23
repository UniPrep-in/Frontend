import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanId } from "@/lib/plans";

export type StreamKey = "science" | "commerce" | "arts";

export const STREAM_OPTIONS: readonly { key: StreamKey; label: string }[] = [
  { key: "science", label: "Science" },
  { key: "commerce", label: "Commerce" },
  { key: "arts", label: "Arts" },
];

const BASIC_BASE_AMOUNT_PAISE = 59900;
const BASIC_GAT_ADDON_PAISE = 19900;
const PRO_AMOUNT_PAISE = 399900;
const ADVANCE_AMOUNT_PAISE = 499900;

export function isValidStream(stream: string): stream is StreamKey {
  return STREAM_OPTIONS.some((option) => option.key === stream);
}

export function getPlanCheckoutAmountPaise(
  planId: PlanId,
  includeGat: boolean,
) {
  switch (planId) {
    case "basic":
      return BASIC_BASE_AMOUNT_PAISE + (includeGat ? BASIC_GAT_ADDON_PAISE : 0);
    case "pro":
      return PRO_AMOUNT_PAISE;
    case "advance":
      return ADVANCE_AMOUNT_PAISE;
    default:
      return 0;
  }
}

export function isGatIncludedInPlan(planId: PlanId) {
  return planId === "pro" || planId === "advance";
}

export function normalizeIncludeGat(planId: PlanId, includeGat?: boolean) {
  if (planId === "basic") {
    return Boolean(includeGat);
  }

  return true;
}

export function getDisplayPriceRupees(amountPaise: number) {
  return Math.round(amountPaise / 100);
}

type CreatePendingSubscriptionInput = {
  userId: string;
  planType: string;
  stream: StreamKey;
  orderId: string;
  amount: number;
  currency: string;
  gat: boolean;
  gateway?: string;
  notes?: Record<string, unknown> | null;
};

type MarkSubscriptionVerifiedInput = {
  userId: string;
  orderId: string;
  paymentId: string;
};

type MarkSubscriptionFailedInput = {
  userId: string;
  orderId: string;
  failureReason: string;
  paymentId?: string | null;
};

export async function createPendingSubscription(
  supabase: SupabaseClient,
  input: CreatePendingSubscriptionInput,
) {
  return supabase.from("subscriptions").insert({
    user_id: input.userId,
    plan_type: input.planType,
    stream: input.stream,
    order_id: input.orderId,
    payment_id: null,
    amount: input.amount,
    currency: input.currency,
    payment_status: "pending",
    gat: input.gat,
    gateway: input.gateway ?? "razorpay",
    notes: input.notes ?? null,
    updated_at: new Date().toISOString(),
    paid_at: null,
    verified_at: null,
    failure_reason: null,
  });
}

export async function markSubscriptionVerified(
  supabase: SupabaseClient,
  input: MarkSubscriptionVerifiedInput,
) {
  const now = new Date().toISOString();
  const { data: existingSubscription, error: fetchError } = await supabase
    .from("subscriptions")
    .select("id, plan_type, payment_status, payment_id")
    .eq("order_id", input.orderId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (fetchError) {
    return { data: null, error: fetchError };
  }

  if (!existingSubscription) {
    return {
      data: null,
      error: { message: "Subscription record not found" },
    };
  }

  if (
    existingSubscription.payment_status === "verified" &&
    existingSubscription.payment_id === input.paymentId
  ) {
    return { data: existingSubscription, error: null };
  }

  return supabase
    .from("subscriptions")
    .update({
      payment_id: input.paymentId,
      payment_status: "verified",
      paid_at: now,
      verified_at: now,
      updated_at: now,
      failure_reason: null,
    })
    .eq("id", existingSubscription.id)
    .select("id, plan_type, payment_status, payment_id")
    .single();
}

export async function markSubscriptionFailed(
  supabase: SupabaseClient,
  input: MarkSubscriptionFailedInput,
) {
  const now = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    payment_status: "failed",
    failure_reason: input.failureReason,
    updated_at: now,
  };

  if (input.paymentId) {
    updatePayload.payment_id = input.paymentId;
  }

  return supabase
    .from("subscriptions")
    .update(updatePayload)
    .eq("order_id", input.orderId)
    .eq("user_id", input.userId)
    .select("id, payment_status, failure_reason")
    .single();
}
