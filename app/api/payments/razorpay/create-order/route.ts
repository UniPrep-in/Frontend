import { NextResponse } from "next/server";
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

    const amountPaise = getPlanCheckoutAmountPaise(plan.id, includeGat);

    const order = await createRazorpayOrder({
      amountPaise,
      currency: "INR",
      receipt: `${plan.id}-${Date.now()}`,
      userId: user.id,
      planId: plan.id,
      planName: `${plan.planType} - ${plan.name}`,
      stream,
      includeGat,
    });

    const adminSupabase = createAdminClient();
    const { error: subscriptionError } = await createPendingSubscription(
      adminSupabase,
      {
        userId: user.id,
        planType: plan.planType,
        stream,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        gat: includeGat,
        gateway: "razorpay",
        notes: {
          planId: plan.id,
          planName: `${plan.planType} - ${plan.name}`,
          includeGat,
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
    });
  } catch (error) {
    console.error("Razorpay create-order failed", error);

    return NextResponse.json(
      { error: "Unable to initialize checkout right now" },
      { status: 500 },
    );
  }
}
