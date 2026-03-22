import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlanById } from "@/lib/plans";
import {
  getRazorpayOrder,
  getRazorpayPayment,
  verifyRazorpaySignature,
} from "@/lib/razorpay";
import { upsertProfilePlanStatus } from "@/lib/profile-plan-status";

export const runtime = "nodejs";

type VerifyPayload = {
  planId?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
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

    const body = (await req.json().catch(() => null)) as VerifyPayload | null;
    const planId = body?.planId?.trim() || "";
    const orderId = body?.razorpay_order_id?.trim() || "";
    const paymentId = body?.razorpay_payment_id?.trim() || "";
    const signature = body?.razorpay_signature?.trim() || "";

    const plan = getPlanById(planId);

    if (!plan || !orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: "Invalid payment verification payload" },
        { status: 400 },
      );
    }

    const isValidSignature = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature,
    });

    if (!isValidSignature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 },
      );
    }

    const [order, payment] = await Promise.all([
      getRazorpayOrder(orderId),
      getRazorpayPayment(paymentId),
    ]);
    const expectedPlanName = `${plan.planType} - ${plan.name}`;

    if (
      payment.order_id !== orderId ||
      payment.amount !== plan.amountPaise ||
      payment.currency !== "INR" ||
      order.amount !== plan.amountPaise ||
      order.currency !== "INR" ||
      order.notes?.user_id !== user.id ||
      order.notes?.plan_id !== plan.id ||
      order.notes?.plan_name !== expectedPlanName
    ) {
      return NextResponse.json(
        { error: "Payment details do not match the selected plan" },
        { status: 400 },
      );
    }

    const purchasedAt = payment.created_at
      ? new Date(payment.created_at * 1000).toISOString()
      : new Date().toISOString();

    const { data: updatedProfile, error: profileError } = await upsertProfilePlanStatus(
      supabase,
      {
        userId: user.id,
        planId: plan.id,
        paymentStatus: "verified",
        purchasedAt,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
      },
    );

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      profileId: updatedProfile.id,
      planId: updatedProfile.plan_id,
      paymentStatus: updatedProfile.payment_status,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to verify payment";

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
