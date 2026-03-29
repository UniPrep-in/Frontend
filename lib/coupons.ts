import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanId } from "@/lib/plans";

type DiscountType = "percent" | "fixed";

type CouponRow = {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  allowed_plan_ids: string[];
  is_active: boolean;
  valid_from: string;
  valid_until: string;
};

export type CouponValidationFailure = {
  valid: false;
  message: string;
};

export type CouponValidationSuccess = {
  valid: true;
  couponId: string;
  couponCode: string;
  discountType: DiscountType;
  discountValue: number;
  baseAmountPaise: number;
  discountAmountPaise: number;
  finalAmountPaise: number;
};

export type CouponValidationResult =
  | CouponValidationFailure
  | CouponValidationSuccess;

type ValidateCouponForCheckoutInput = {
  supabase: SupabaseClient;
  couponCode: string;
  planId: PlanId;
  baseAmountPaise: number;
};

function getDatePart(
  parts: Intl.DateTimeFormatPart[],
  type: "day" | "month" | "year",
) {
  return parts.find((part) => part.type === type)?.value ?? "";
}

export function normalizeCouponCode(input: string | null | undefined) {
  return input?.trim().toUpperCase() ?? "";
}

export function getIndiaDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = getDatePart(parts, "year");
  const month = getDatePart(parts, "month");
  const day = getDatePart(parts, "day");

  return `${year}-${month}-${day}`;
}

function calculateDiscountAmountPaise(input: {
  baseAmountPaise: number;
  discountType: DiscountType;
  discountValue: number;
}) {
  if (input.discountType === "percent") {
    return Math.round((input.baseAmountPaise * input.discountValue) / 100);
  }

  return Math.round(input.discountValue * 100);
}

export function buildCheckoutAmountSnapshot(
  baseAmountPaise: number,
  coupon: CouponValidationSuccess | null = null,
) {
  return {
    baseAmountPaise,
    discountAmountPaise: coupon?.discountAmountPaise ?? 0,
    finalAmountPaise: coupon?.finalAmountPaise ?? baseAmountPaise,
  };
}

export function buildCouponSnapshotNotes(
  baseAmountPaise: number,
  coupon: CouponValidationSuccess | null = null,
) {
  return {
    base_amount_paise: String(baseAmountPaise),
    discount_amount_paise: String(coupon?.discountAmountPaise ?? 0),
    final_amount_paise: String(coupon?.finalAmountPaise ?? baseAmountPaise),
    ...(coupon
      ? {
          coupon_code: coupon.couponCode,
          coupon_id: coupon.couponId,
          coupon_discount_type: coupon.discountType,
          coupon_discount_value: String(coupon.discountValue),
        }
      : {}),
  };
}

export function getExpectedAmountPaiseFromOrderNotes(
  notes: { final_amount_paise?: string } | null | undefined,
  fallbackAmountPaise: number,
) {
  const parsedAmount = Number(notes?.final_amount_paise);

  if (Number.isFinite(parsedAmount) && parsedAmount >= 0) {
    return parsedAmount;
  }

  return fallbackAmountPaise;
}

export async function validateCouponForCheckout(
  input: ValidateCouponForCheckoutInput,
): Promise<CouponValidationResult> {
  const normalizedCode = normalizeCouponCode(input.couponCode);

  if (!normalizedCode) {
    return {
      valid: false,
      message: "Enter a coupon code to apply it.",
    };
  }

  const { data, error } = await input.supabase
    .from("coupons")
    .select(
      "id, code, discount_type, discount_value, allowed_plan_ids, is_active, valid_from, valid_until",
    )
    .ilike("code", normalizedCode)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return {
      valid: false,
      message: "This coupon code is invalid.",
    };
  }

  const coupon = data as CouponRow;

  if (!coupon.is_active) {
    return {
      valid: false,
      message: "This coupon is inactive.",
    };
  }

  const today = getIndiaDateString();

  if (today < coupon.valid_from) {
    return {
      valid: false,
      message: "This coupon is not active yet.",
    };
  }

  if (today > coupon.valid_until) {
    return {
      valid: false,
      message: "This coupon has expired.",
    };
  }

  if (!coupon.allowed_plan_ids.includes(input.planId)) {
    return {
      valid: false,
      message: "This coupon is not applicable to the selected plan.",
    };
  }

  const discountAmountPaise = Math.min(
    input.baseAmountPaise,
    Math.max(
      0,
      calculateDiscountAmountPaise({
        baseAmountPaise: input.baseAmountPaise,
        discountType: coupon.discount_type,
        discountValue: Number(coupon.discount_value),
      }),
    ),
  );

  return {
    valid: true,
    couponId: coupon.id,
    couponCode: normalizeCouponCode(coupon.code),
    discountType: coupon.discount_type,
    discountValue: Number(coupon.discount_value),
    baseAmountPaise: input.baseAmountPaise,
    discountAmountPaise,
    finalAmountPaise: Math.max(0, input.baseAmountPaise - discountAmountPaise),
  };
}
