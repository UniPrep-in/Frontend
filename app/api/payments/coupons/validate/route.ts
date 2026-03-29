import { NextResponse } from "next/server";

import type { PlanId } from "@/lib/plans";
import { getPlanById } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  normalizeIncludeGat,
  getPlanCheckoutAmountPaise,
  isValidStream,
} from "@/lib/subscriptions";
import { validateCouponForCheckout } from "@/lib/coupons";

export const runtime = "nodejs";

type ValidateCouponPayload = {
  planId?: string;
  stream?: string;
  includeGat?: boolean;
  couponCode?: string;
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }

    const body = (await req.json().catch(() => null)) as ValidateCouponPayload | null;
    const planId = body?.planId?.trim() || "";
    const stream = body?.stream?.trim().toLowerCase() || "";
    const plan = getPlanById(planId);

    if (!plan || !isValidStream(stream)) {
      return NextResponse.json(
        { error: "Invalid plan or stream selected" },
        { status: 400 },
      );
    }

    const normalizedIncludeGat = normalizeIncludeGat(
      plan.id,
      body?.includeGat,
    );
    const baseAmountPaise = getPlanCheckoutAmountPaise(
      plan.id,
      normalizedIncludeGat,
    );
    const adminSupabase = createAdminClient();
    const result = await validateCouponForCheckout({
      supabase: adminSupabase,
      couponCode: body?.couponCode ?? "",
      planId: plan.id as PlanId,
      baseAmountPaise,
    });

    if (!result.valid) {
      return NextResponse.json({
        valid: false,
        message: result.message,
      });
    }

    return NextResponse.json({
      valid: true,
      couponCode: result.couponCode,
      couponId: result.couponId,
      discountType: result.discountType,
      discountValue: result.discountValue,
      baseAmountPaise: result.baseAmountPaise,
      discountAmountPaise: result.discountAmountPaise,
      finalAmountPaise: result.finalAmountPaise,
      message: "Coupon applied successfully.",
    });
  } catch (error) {
    console.error("Coupon validation failed", error);

    return NextResponse.json(
      { error: "Unable to validate coupon right now" },
      { status: 500 },
    );
  }
}
