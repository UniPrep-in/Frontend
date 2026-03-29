import { NextResponse } from "next/server";
import { getPlanById } from "@/lib/plans";
import { getExpectedAmountPaiseFromOrderNotes } from "@/lib/coupons";
import {
  getRazorpayOrder,
  getRazorpayPayment,
  verifyRazorpayWebhookSignature,
} from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPlanCheckoutAmountPaise,
  isValidStream,
  markSubscriptionFailed,
  markSubscriptionVerified,
  normalizeIncludeGat,
} from "@/lib/subscriptions";

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
    const stream = order.notes?.stream?.trim().toLowerCase() || "";
    const rawIncludeGat = order.notes?.include_gat?.trim() || "";
    const plan = getPlanById(planId);
    const includeGat = plan
      ? normalizeIncludeGat(plan.id, rawIncludeGat === "true")
      : false;

    if (!userId || !plan || !isValidStream(stream)) {
      return NextResponse.json(
        { error: "Webhook metadata is incomplete" },
        { status: 400 },
      );
    }

    const expectedAmount = getExpectedAmountPaiseFromOrderNotes(
      order.notes,
      getPlanCheckoutAmountPaise(plan.id, includeGat),
    );

    if (
      payment.order_id !== orderId ||
      payment.amount !== expectedAmount ||
      payment.currency !== "INR" ||
      order.amount !== expectedAmount ||
      order.currency !== "INR" ||
      order.notes?.user_id !== userId ||
      order.notes?.plan_id !== plan.id ||
      order.notes?.plan_name !== `${plan.planType} - ${plan.name}` ||
      expectedPlanName !== `${plan.planType} - ${plan.name}` ||
      order.notes?.stream !== stream ||
      order.notes?.include_gat !== String(includeGat)
    ) {
      const adminSupabase = createAdminClient();
      await markSubscriptionFailed(adminSupabase, {
        userId,
        orderId,
        paymentId,
        failureReason: "Webhook payment details did not match the selected plan",
      });

      return NextResponse.json(
        { error: "Webhook payment details do not match the selected plan" },
        { status: 400 },
      );
    }

    const adminSupabase = createAdminClient();
    const { error: subscriptionError } = await markSubscriptionVerified(
      adminSupabase,
      {
        userId,
        orderId,
        paymentId,
      },
    );

    if (subscriptionError) {
      console.error("Failed to mark subscription verified from webhook", subscriptionError);
      return NextResponse.json(
        { error: "Unable to process webhook" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      planId: plan.id,
      paymentStatus: "verified",
    });
  } catch (error) {
    console.error("Razorpay webhook failed", error);

    return NextResponse.json(
      { error: "Unable to process webhook" },
      { status: 500 },
    );
  }
}
