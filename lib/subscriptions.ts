import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanId } from "@/lib/plans";

export type StreamKey = "science" | "commerce" | "arts";
export type MainStreamLabel = "Science" | "Commerce" | "Arts";
export type ContentStreamLabel = MainStreamLabel | "English" | "GAT";
export type ContentCategory = "all" | "main" | "english" | "gat";
export type SubscriptionAccess = {
  planType: string;
  paymentStatus: string;
  baseStreamKey: StreamKey;
  baseStreamLabel: MainStreamLabel;
  hasEnglish: true;
  hasGat: boolean;
  isSubscriber: boolean;
  selectableMainStreams: MainStreamLabel[];
  allowedContentStreams: ContentStreamLabel[];
  allowedQueryStreams: string[];
  allowedCategories: ContentCategory[];
};

export const STREAM_OPTIONS: readonly { key: StreamKey; label: string }[] = [
  { key: "science", label: "Science" },
  { key: "commerce", label: "Commerce" },
  { key: "arts", label: "Arts" },
];
const MAIN_STREAM_LABELS: readonly MainStreamLabel[] = [
  "Science",
  "Commerce",
  "Arts",
];
const DEFAULT_BROWSE_STREAM: StreamKey = "science";

const BASIC_BASE_AMOUNT_PAISE = 59900;
const BASIC_GAT_ADDON_PAISE = 19900;
const PRO_AMOUNT_PAISE = 399900;
const ADVANCE_AMOUNT_PAISE = 499900;
const ENGLISH_SUBJECT_ALIASES = ["english", "grammar", "comprehension"];
const GAT_SUBJECT_ALIASES = [
  "gat",
  "general test",
  "general aptitude test",
  "general aptitude",
  "reasoning",
  "current affairs",
  "quantitative aptitude",
];
const STREAM_QUERY_ALIASES: Record<ContentStreamLabel, string[]> = {
  Science: ["Science", "science"],
  Commerce: ["Commerce", "commerce"],
  Arts: ["Arts", "Art", "arts", "art", "Humanities", "humanities"],
  English: ["English", "english"],
  GAT: ["GAT", "gat"],
};

export function isValidStream(stream: string): stream is StreamKey {
  return STREAM_OPTIONS.some((option) => option.key === stream);
}

export function normalizeStreamKey(
  stream: string | null | undefined,
): StreamKey | null {
  const normalized = stream?.trim().toLowerCase();

  switch (normalized) {
    case "science":
      return "science";
    case "commerce":
      return "commerce";
    case "arts":
    case "art":
    case "humanities":
      return "arts";
    default:
      return null;
  }
}

export function getBaseStreamLabel(stream: StreamKey): MainStreamLabel {
  switch (stream) {
    case "science":
      return "Science";
    case "commerce":
      return "Commerce";
    case "arts":
      return "Arts";
    default:
      return "Arts";
  }
}

export function normalizeContentStreamLabel(
  stream: string | null | undefined,
): ContentStreamLabel | null {
  const streamKey = normalizeStreamKey(stream);

  if (streamKey) {
    return getBaseStreamLabel(streamKey);
  }

  const normalized = stream?.trim().toLowerCase();

  if (normalized === "english") {
    return "English";
  }

  if (normalized === "gat") {
    return "GAT";
  }

  return null;
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

export function getAllowedContentStreamsForPurchase(
  stream: StreamKey,
  gat: boolean,
): ContentStreamLabel[] {
  const mainStream = getBaseStreamLabel(stream);
  const allowed: ContentStreamLabel[] = [mainStream, "English"];

  if (gat) {
    allowed.push("GAT");
  }

  return allowed;
}

export function getAllowedQueryStreamsFromContent(
  allowedContentStreams: ContentStreamLabel[],
) {
  return Array.from(
    new Set(
      allowedContentStreams.flatMap(
        (stream) => STREAM_QUERY_ALIASES[stream] ?? [],
      ),
    ),
  );
}

export function getAllowedCategories(hasGat: boolean): ContentCategory[] {
  return hasGat
    ? ["all", "main", "english", "gat"]
    : ["all", "main", "english"];
}

export function getSelectableMainStreams(): MainStreamLabel[] {
  return [...MAIN_STREAM_LABELS];
}

export function normalizeContentCategory(
  category: string | null | undefined,
): ContentCategory {
  const normalized = category?.trim().toLowerCase();

  if (
    normalized === "main" ||
    normalized === "english" ||
    normalized === "gat"
  ) {
    return normalized;
  }

  return "all";
}

export function getQueryStreamsForCategory(
  access: SubscriptionAccess,
  category: ContentCategory,
) {
  switch (category) {
    case "main":
      return getAllowedQueryStreamsFromContent([access.baseStreamLabel]);
    case "english":
      return getAllowedQueryStreamsFromContent(["English"]);
    case "gat":
      return access.hasGat
        ? getAllowedQueryStreamsFromContent(["GAT"])
        : [];
    case "all":
    default:
      return access.allowedQueryStreams;
  }
}

function normalizeSubjectValue(subject: string | null | undefined) {
  return subject?.trim().toLowerCase() ?? "";
}

export function isEnglishContentSubject(subject: string | null | undefined) {
  return ENGLISH_SUBJECT_ALIASES.includes(normalizeSubjectValue(subject));
}

export function isGatContentSubject(subject: string | null | undefined) {
  return GAT_SUBJECT_ALIASES.includes(normalizeSubjectValue(subject));
}

export function getContentCategoryForStream(
  stream: string | null | undefined,
  baseStreamLabel: MainStreamLabel,
): Exclude<ContentCategory, "all"> | null {
  const normalizedStream = normalizeContentStreamLabel(stream);

  if (!normalizedStream) {
    return null;
  }

  if (normalizedStream === baseStreamLabel) {
    return "main";
  }

  if (normalizedStream === "English") {
    return "english";
  }

  if (normalizedStream === "GAT") {
    return "gat";
  }

  return null;
}

export function resolveContentMeta(
  stream: string | null | undefined,
  subject: string | null | undefined,
): {
  category: Exclude<ContentCategory, "all">;
  mainStreamLabel: MainStreamLabel | null;
} | null {
  if (isEnglishContentSubject(subject)) {
    return { category: "english", mainStreamLabel: null };
  }

  if (isGatContentSubject(subject)) {
    return { category: "gat", mainStreamLabel: null };
  }

  const mainStreamLabel = normalizeContentStreamLabel(stream);

  if (
    mainStreamLabel === "Science" ||
    mainStreamLabel === "Commerce" ||
    mainStreamLabel === "Arts"
  ) {
    return { category: "main", mainStreamLabel };
  }

  return null;
}

export function getMockContentCategory(
  stream: string | null | undefined,
  subject: string | null | undefined,
  baseStreamLabel: MainStreamLabel,
): Exclude<ContentCategory, "all"> | null {
  const contentMeta = resolveContentMeta(stream, subject);

  if (!contentMeta) {
    return null;
  }

  if (contentMeta.category !== "main") {
    return contentMeta.category;
  }

  return contentMeta.mainStreamLabel === baseStreamLabel ? "main" : null;
}

export function getDisplayPriceRupees(amountPaise: number) {
  return Math.round(amountPaise / 100);
}

type VerifiedSubscriptionRow = {
  plan_type: string;
  payment_status: string;
  stream: string | null;
  gat: boolean | null;
};

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

export function resolveSubscriptionAccess(
  subscription: VerifiedSubscriptionRow | null | undefined,
): SubscriptionAccess | null {
  if (
    !subscription ||
    subscription.payment_status !== "verified" ||
    !subscription.stream ||
    !isValidStream(subscription.stream)
  ) {
    return null;
  }

  const hasGat = Boolean(subscription.gat);
  const baseStreamKey = subscription.stream;
  const baseStreamLabel = getBaseStreamLabel(baseStreamKey);
  const allowedContentStreams = getAllowedContentStreamsForPurchase(
    baseStreamKey,
    hasGat,
  );

  return {
    planType: subscription.plan_type,
    paymentStatus: subscription.payment_status,
    baseStreamKey,
    baseStreamLabel,
    hasEnglish: true,
    hasGat,
    isSubscriber: true,
    selectableMainStreams: [baseStreamLabel],
    allowedContentStreams,
    allowedQueryStreams: getAllowedQueryStreamsFromContent(
      allowedContentStreams,
    ),
    allowedCategories: getAllowedCategories(hasGat),
  };
}

export function createBrowseAccess(
  requestedStream?: string | null,
): SubscriptionAccess {
  const baseStreamKey = normalizeStreamKey(requestedStream) ?? DEFAULT_BROWSE_STREAM;
  const baseStreamLabel = getBaseStreamLabel(baseStreamKey);
  const allowedContentStreams = getAllowedContentStreamsForPurchase(
    baseStreamKey,
    true,
  );

  return {
    planType: "browse",
    paymentStatus: "browse",
    baseStreamKey,
    baseStreamLabel,
    hasEnglish: true,
    hasGat: true,
    isSubscriber: false,
    selectableMainStreams: getSelectableMainStreams(),
    allowedContentStreams,
    allowedQueryStreams: getAllowedQueryStreamsFromContent(
      allowedContentStreams,
    ),
    allowedCategories: getAllowedCategories(true),
  };
}

export async function getLatestVerifiedSubscriptionAccess(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan_type, payment_status, stream, gat")
    .eq("user_id", userId)
    .eq("payment_status", "verified")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  return {
    data: resolveSubscriptionAccess(data as VerifiedSubscriptionRow | null),
    error: null,
  };
}
