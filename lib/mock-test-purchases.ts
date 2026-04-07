import type { SupabaseClient } from "@supabase/supabase-js";
import { getLatestVerifiedSubscriptionAccess } from "@/lib/subscriptions";

const SINGLE_MOCK_PRICE_KEY = "single_mock_price_paise";
export const DEFAULT_SINGLE_MOCK_PRICE_PAISE = 900;

type PaymentConfigRow = {
  value_number: number | null;
};

type VerifiedPurchaseRow = {
  id: string;
  payment_status: string;
  razorpay_payment_id: string | null;
};

type CreatePendingMockPurchaseInput = {
  userId: string;
  testId: string;
  orderId: string;
  amount: number;
  currency: string;
  gateway?: string;
};

type MarkMockPurchaseVerifiedInput = {
  userId: string;
  testId: string;
  orderId: string;
  paymentId: string;
  signature?: string | null;
};

type MarkMockPurchaseFailedInput = {
  userId: string;
  testId: string;
  orderId: string;
  failureReason: string;
  paymentId?: string | null;
};

export type MockAccessState = {
  hasSubscriptionAccess: boolean;
  isPurchased: boolean;
  hasFreeMockAvailable: boolean;
  attemptCount: number;
  hasReachedAttemptLimit: boolean;
  canAccess: boolean;
};

type TestSerialRow = {
  id?: string;
  serial_no: number | null;
};

export async function hasConsumedFreeMock(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("test_attempts")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  return {
    data: Boolean(data),
    error,
  };
}

export async function getAttemptCountForTest(
  supabase: SupabaseClient,
  userId: string,
  testId: string,
) {
  const { count, error } = await supabase
    .from("test_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("test_id", testId);

  return {
    data: count ?? 0,
    error,
  };
}

export async function getAttemptCountsByTest(
  supabase: SupabaseClient,
  userId: string,
  testIds: string[],
) {
  if (testIds.length === 0) {
    return {
      data: new Map<string, number>(),
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("test_attempts")
    .select("test_id")
    .eq("user_id", userId)
    .in("test_id", testIds);

  if (error) {
    return {
      data: new Map<string, number>(),
      error,
    };
  }

  const attemptCounts = new Map<string, number>();

  (((data ?? []) as Array<{ test_id: string | null }>)).forEach((attempt) => {
    if (!attempt.test_id) {
      return;
    }

    attemptCounts.set(
      attempt.test_id,
      (attemptCounts.get(attempt.test_id) ?? 0) + 1,
    );
  });

  return {
    data: attemptCounts,
    error: null,
  };
}

export async function getSelectedFreeMockTestId(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data: attempts, error: attemptsError } = await supabase
    .from("test_attempts")
    .select("test_id")
    .eq("user_id", userId);

  if (attemptsError) {
    return {
      data: null,
      error: attemptsError,
    };
  }

  const attemptedTestIds = Array.from(
    new Set(
      ((attempts ?? []) as Array<{ test_id: string | null }>).flatMap((attempt) =>
        attempt.test_id ? [attempt.test_id] : [],
      ),
    ),
  );

  if (attemptedTestIds.length === 0) {
    return {
      data: null,
      error: null,
    };
  }

  const { data: freeSerialTests, error: testsError } = await supabase
    .from("tests")
    .select("id, serial_no")
    .in("id", attemptedTestIds)
    .eq("serial_no", 1);

  if (testsError) {
    return {
      data: null,
      error: testsError,
    };
  }

  const freeSerialTestIds = new Set(
    ((freeSerialTests ?? []) as Array<TestSerialRow>).flatMap((test) =>
      test.id ? [test.id] : [],
    ),
  );

  const selectedFreeMockTestId =
    ((attempts ?? []) as Array<{ test_id: string | null }>).find(
      (attempt) => attempt.test_id && freeSerialTestIds.has(attempt.test_id),
    )?.test_id ?? null;

  return {
    data: selectedFreeMockTestId,
    error: null,
  };
}

export async function getSingleMockPricePaise(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("payment_config")
    .select("value_number")
    .eq("key", SINGLE_MOCK_PRICE_KEY)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  const price = Number((data as PaymentConfigRow | null)?.value_number);

  if (!Number.isInteger(price) || price <= 0) {
    return {
      data: DEFAULT_SINGLE_MOCK_PRICE_PAISE,
      error: null,
    };
  }

  return {
    data: price,
    error: null,
  };
}

export async function hasVerifiedMockPurchase(
  supabase: SupabaseClient,
  userId: string,
  testId: string,
) {
  const { data, error } = await supabase
    .from("mock_test_purchases")
    .select("id")
    .eq("user_id", userId)
    .eq("test_id", testId)
    .eq("payment_status", "verified")
    .maybeSingle();

  return {
    data: Boolean(data),
    error,
  };
}

export async function getVerifiedPurchasedTestIds(
  supabase: SupabaseClient,
  userId: string,
  testIds: string[],
) {
  if (testIds.length === 0) {
    return {
      data: new Set<string>(),
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("mock_test_purchases")
    .select("test_id")
    .eq("user_id", userId)
    .eq("payment_status", "verified")
    .in("test_id", testIds);

  if (error) {
    return {
      data: new Set<string>(),
      error,
    };
  }

  return {
    data: new Set(
      ((data ?? []) as Array<{ test_id: string | null }>).flatMap((row) =>
        row.test_id ? [row.test_id] : [],
      ),
    ),
    error: null,
  };
}

export async function createPendingMockPurchase(
  supabase: SupabaseClient,
  input: CreatePendingMockPurchaseInput,
) {
  return supabase.from("mock_test_purchases").insert({
    user_id: input.userId,
    test_id: input.testId,
    amount_paise: input.amount,
    currency: input.currency,
    gateway: input.gateway ?? "razorpay",
    payment_status: "pending",
    razorpay_order_id: input.orderId,
    razorpay_payment_id: null,
    razorpay_signature: null,
    failure_reason: null,
    updated_at: new Date().toISOString(),
    paid_at: null,
    verified_at: null,
  });
}

export async function markMockPurchaseVerified(
  supabase: SupabaseClient,
  input: MarkMockPurchaseVerifiedInput,
) {
  const now = new Date().toISOString();
  const { data: existingPurchase, error: fetchError } = await supabase
    .from("mock_test_purchases")
    .select("id, payment_status, razorpay_payment_id")
    .eq("user_id", input.userId)
    .eq("test_id", input.testId)
    .eq("razorpay_order_id", input.orderId)
    .maybeSingle();

  if (fetchError) {
    return { data: null, error: fetchError };
  }

  if (!existingPurchase) {
    return {
      data: null,
      error: { message: "Mock purchase record not found" },
    };
  }

  const purchase = existingPurchase as VerifiedPurchaseRow;

  if (
    purchase.payment_status === "verified" &&
    purchase.razorpay_payment_id === input.paymentId
  ) {
    return {
      data: existingPurchase,
      error: null,
    };
  }

  return supabase
    .from("mock_test_purchases")
    .update({
      payment_status: "verified",
      razorpay_payment_id: input.paymentId,
      razorpay_signature: input.signature ?? null,
      paid_at: now,
      verified_at: now,
      updated_at: now,
      failure_reason: null,
    })
    .eq("id", purchase.id)
    .select("id, payment_status, razorpay_payment_id")
    .single();
}

export async function markMockPurchaseFailed(
  supabase: SupabaseClient,
  input: MarkMockPurchaseFailedInput,
) {
  const now = new Date().toISOString();
  const updatePayload: Record<string, string> = {
    payment_status: "failed",
    failure_reason: input.failureReason,
    updated_at: now,
  };

  if (input.paymentId) {
    updatePayload.razorpay_payment_id = input.paymentId;
  }

  return supabase
    .from("mock_test_purchases")
    .update(updatePayload)
    .eq("user_id", input.userId)
    .eq("test_id", input.testId)
    .eq("razorpay_order_id", input.orderId)
    .select("id, payment_status, failure_reason")
    .maybeSingle();
}

export async function getMockAccessState(
  supabase: SupabaseClient,
  userId: string,
  testId: string,
): Promise<{ data: MockAccessState | null; error: { message: string } | null }> {
  const [
    subscriptionResult,
    purchaseResult,
    attemptCountResult,
    testResult,
    selectedFreeMockResult,
  ] =
    await Promise.all([
      getLatestVerifiedSubscriptionAccess(supabase, userId),
      hasVerifiedMockPurchase(supabase, userId, testId),
      getAttemptCountForTest(supabase, userId, testId),
      supabase
        .from("tests")
        .select("serial_no")
        .eq("id", testId)
        .maybeSingle(),
      getSelectedFreeMockTestId(supabase, userId),
    ]);

  if (subscriptionResult.error) {
    return {
      data: null,
      error: { message: subscriptionResult.error.message },
    };
  }

  if (purchaseResult.error) {
    return {
      data: null,
      error: { message: purchaseResult.error.message },
    };
  }

  if (testResult.error) {
    return {
      data: null,
      error: { message: testResult.error.message },
    };
  }

  if (attemptCountResult.error) {
    return {
      data: null,
      error: { message: attemptCountResult.error.message },
    };
  }

  if (selectedFreeMockResult.error) {
    return {
      data: null,
      error: { message: selectedFreeMockResult.error.message },
    };
  }

  const hasSubscriptionAccess = Boolean(subscriptionResult.data);
  const isPurchased = Boolean(purchaseResult.data);
  const serialNo = (testResult.data as TestSerialRow | null)?.serial_no ?? null;
  const isFreeSerialMock = serialNo === 1;
  const attemptCount = attemptCountResult.data;
  const selectedFreeMockTestId = selectedFreeMockResult.data;
  const isSelectedFreeMock =
    selectedFreeMockTestId === null || selectedFreeMockTestId === testId;
  const hasFreeMockAvailable =
    !hasSubscriptionAccess &&
    !isPurchased &&
    isFreeSerialMock &&
    isSelectedFreeMock &&
    attemptCount === 0;
  const hasReachedAttemptLimit = attemptCount >= 2;
  const canAttemptThisMock = attemptCount < 2;
  const hasFreeAccessToThisMock = isFreeSerialMock && isSelectedFreeMock;

  return {
    data: {
      hasSubscriptionAccess,
      isPurchased,
      hasFreeMockAvailable,
      attemptCount,
      hasReachedAttemptLimit,
      canAccess:
        (hasSubscriptionAccess || isPurchased || hasFreeAccessToThisMock) &&
        canAttemptThisMock,
    },
    error: null,
  };
}
