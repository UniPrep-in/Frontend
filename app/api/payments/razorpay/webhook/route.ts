import { NextResponse } from "next/server";
import { getPlanById } from "@/lib/plans";
import {
  getRazorpayOrder,
  getRazorpayPayment,
  verifyRazorpayWebhookSignature,
} from "@/lib/razorpay";
import { upsertProfilePlanStatus } from "@/lib/profile-plan-status";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        currency?: string;
      };
    };
  };
};

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-razorpay-signature")?.trim() || "";
    const rawBody = await req.text();

    if (!signature || !rawBody) {
      return NextResponse.json(
        { error: "Invalid webhook request" },
        { status: 400 },
      );
    }

    const isValidSignature = verifyRazorpayWebhookSignature({
      body: rawBody,
      signature,
    });

    if (!isValidSignature) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 },
      );
    }

    const payload = JSON.parse(rawBody) as RazorpayWebhookPayload;

    if (payload.event !== "payment.captured") {
      return NextResponse.json({
        success: true,
        ignored: true,
      });
    }

    const paymentEntity = payload.payload?.payment?.entity;
    const paymentId = paymentEntity?.id?.trim() || "";
    const orderId = paymentEntity?.order_id?.trim() || "";

    if (!paymentId || !orderId) {
      return NextResponse.json(
        { error: "Webhook payload is missing payment details" },
        { status: 400 },
      );
    }

    const [payment, order] = await Promise.all([
      getRazorpayPayment(paymentId),
      getRazorpayOrder(orderId),
    ]);

    const userId = order.notes?.user_id?.trim() || "";
    const planId = order.notes?.plan_id?.trim() || "";
    const expectedPlanName = order.notes?.plan_name?.trim() || "";
    const plan = getPlanById(planId);

    if (!userId || !plan) {
      return NextResponse.json(
        { error: "Webhook metadata is incomplete" },
        { status: 400 },
      );
    }

    if (
      payment.order_id !== orderId ||
      payment.amount !== plan.amountPaise ||
      payment.currency !== "INR" ||
      order.amount !== plan.amountPaise ||
      order.currency !== "INR" ||
      order.notes?.user_id !== userId ||
      order.notes?.plan_id !== plan.id ||
      order.notes?.plan_name !== `${plan.planType} - ${plan.name}` ||
      expectedPlanName !== `${plan.planType} - ${plan.name}`
    ) {
      return NextResponse.json(
        { error: "Webhook payment details do not match the selected plan" },
        { status: 400 },
      );
    }

    const adminSupabase = createAdminClient();
    const purchasedAt = payment.created_at
      ? new Date(payment.created_at * 1000).toISOString()
      : new Date().toISOString();

    const { error: profileError } = await upsertProfilePlanStatus(adminSupabase, {
      userId,
      planId: plan.id,
      paymentStatus: "verified",
      purchasedAt,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
    });

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      planId: plan.id,
      paymentStatus: "verified",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to process Razorpay webhook";

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
