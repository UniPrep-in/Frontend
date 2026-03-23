import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlanById } from "@/lib/plans";
import {
  getRazorpayOrder,
  getRazorpayPayment,
  verifyRazorpaySignature,
} from "@/lib/razorpay";
import {
  getPlanCheckoutAmountPaise,
  isValidStream,
  markSubscriptionFailed,
  markSubscriptionVerified,
  normalizeIncludeGat,
} from "@/lib/subscriptions";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type VerifyPayload = {
  planId?: string;
  stream?: string;
  includeGat?: boolean;
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
    const stream = body?.stream?.trim().toLowerCase() || "";
    const orderId = body?.razorpay_order_id?.trim() || "";
    const paymentId = body?.razorpay_payment_id?.trim() || "";
    const signature = body?.razorpay_signature?.trim() || "";

    const plan = getPlanById(planId);
    const includeGat = plan
      ? normalizeIncludeGat(plan.id, body?.includeGat)
      : false;

    if (!plan || !isValidStream(stream) || !orderId || !paymentId || !signature) {
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
      const adminSupabase = createAdminClient();
      await markSubscriptionFailed(adminSupabase, {
        userId: user.id,
        orderId,
        paymentId,
        failureReason: "Invalid Razorpay payment signature",
      });

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
    const expectedAmount = getPlanCheckoutAmountPaise(plan.id, includeGat);

    if (
      payment.order_id !== orderId ||
      payment.amount !== expectedAmount ||
      payment.currency !== "INR" ||
      order.amount !== expectedAmount ||
      order.currency !== "INR" ||
      order.notes?.user_id !== user.id ||
      order.notes?.plan_id !== plan.id ||
      order.notes?.plan_name !== expectedPlanName ||
      order.notes?.stream !== stream ||
      order.notes?.include_gat !== String(includeGat)
    ) {
      const adminSupabase = createAdminClient();
      await markSubscriptionFailed(adminSupabase, {
        userId: user.id,
        orderId,
        paymentId,
        failureReason: "Payment details did not match the selected plan",
      });

      return NextResponse.json(
        { error: "Payment details do not match the selected plan" },
        { status: 400 },
      );
    }

    const adminSupabase = createAdminClient();
    const { data: updatedSubscription, error: subscriptionError } =
      await markSubscriptionVerified(adminSupabase, {
        userId: user.id,
        orderId,
        paymentId,
      });

    if (subscriptionError) {
      console.error("Failed to verify subscription payment", subscriptionError);
      return NextResponse.json(
        { error: "Unable to verify payment right now" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      subscriptionId: updatedSubscription.id,
      planId: plan.id,
      paymentStatus: updatedSubscription.payment_status,
    });
  } catch (error) {
    console.error("Razorpay verify failed", error);

    return NextResponse.json(
      { error: "Unable to verify payment right now" },
      { status: 500 },
    );
  }
}
