import { NextResponse } from "next/server";
import type { PlanId } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { getPlanById } from "@/lib/plans";
import { createRazorpayOrder, getRazorpayKeyId } from "@/lib/razorpay";
import {
  createPendingSubscription,
  getPlanCheckoutAmountPaise,
  isValidStream,
  normalizeIncludeGat,
} from "@/lib/subscriptions";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildCheckoutAmountSnapshot,
  buildCouponSnapshotNotes,
  validateCouponForCheckout,
} from "@/lib/coupons";

export const runtime = "nodejs";

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

    const body = (await req.json().catch(() => null)) as
      | {
          planId?: string;
          stream?: string;
          includeGat?: boolean;
          couponCode?: string;
        }
      | null;
    const planId = body?.planId?.trim() || "";
    const stream = body?.stream?.trim().toLowerCase() || "";
    const plan = getPlanById(planId);
    const includeGat = plan
      ? normalizeIncludeGat(plan.id, body?.includeGat)
      : false;

    if (!plan || !isValidStream(stream)) {
      return NextResponse.json(
        { error: "Invalid plan or stream selected" },
        { status: 400 },
      );
    }

    const baseAmountPaise = getPlanCheckoutAmountPaise(plan.id, includeGat);
    const adminSupabase = createAdminClient();
    let appliedCoupon = null;

    if (body?.couponCode) {
      const couponResult = await validateCouponForCheckout({
        supabase: adminSupabase,
        couponCode: body.couponCode,
        planId: plan.id as PlanId,
        baseAmountPaise,
      });

      if (!couponResult.valid) {
        return NextResponse.json(
          { error: couponResult.message },
          { status: 400 },
        );
      }

      appliedCoupon = couponResult;
    }

    const amountSnapshot = buildCheckoutAmountSnapshot(baseAmountPaise, appliedCoupon);
    const couponSnapshotNotes = buildCouponSnapshotNotes(baseAmountPaise, appliedCoupon);

    const order = await createRazorpayOrder({
      amountPaise: amountSnapshot.finalAmountPaise,
      currency: "INR",
      receipt: `${plan.id}-${Date.now()}`,
      notes: {
        purchase_type: "subscription",
        user_id: user.id,
        plan_id: plan.id,
        plan_name: `${plan.planType} - ${plan.name}`,
        stream,
        include_gat: String(includeGat),
        ...couponSnapshotNotes,
      },
    });

    const { error: subscriptionError } = await createPendingSubscription(
      adminSupabase,
      {
        userId: user.id,
        planType: plan.planType,
        stream,
        orderId: order.id,
        amount: amountSnapshot.finalAmountPaise,
        currency: order.currency,
        gat: includeGat,
        gateway: "razorpay",
        notes: {
          planId: plan.id,
          planName: `${plan.planType} - ${plan.name}`,
          includeGat,
          ...couponSnapshotNotes,
        },
      },
    );

    if (subscriptionError) {
      console.error("Failed to create pending subscription", subscriptionError);
      return NextResponse.json(
        { error: "Unable to initialize checkout right now" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: getRazorpayKeyId(),
      planId: plan.id,
      planName: `${plan.planType} - ${plan.name}`,
      stream,
      includeGat,
      baseAmountPaise: amountSnapshot.baseAmountPaise,
      discountAmountPaise: amountSnapshot.discountAmountPaise,
      finalAmountPaise: amountSnapshot.finalAmountPaise,
      couponCode: appliedCoupon?.couponCode ?? null,
    });
  } catch (error) {
    console.error("Razorpay create-order failed", error);

    return NextResponse.json(
      { error: "Unable to initialize checkout right now" },
      { status: 500 },
    );
  }
}
