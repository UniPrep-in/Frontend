import { NextResponse } from "next/server";
import { getExpectedAmountPaiseFromOrderNotes } from "@/lib/coupons";
import {
  getSingleMockPricePaise,
  markMockPurchaseFailed,
  markMockPurchaseVerified,
} from "@/lib/mock-test-purchases";
import {
  getRazorpayOrder,
  getRazorpayPayment,
  verifyRazorpaySignature,
} from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type VerifyBody = {
  testId?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
} | null;

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

    const body = (await req.json().catch(() => null)) as VerifyBody;
    const testId = body?.testId?.trim() || "";
    const orderId = body?.razorpay_order_id?.trim() || "";
    const paymentId = body?.razorpay_payment_id?.trim() || "";
    const signature = body?.razorpay_signature?.trim() || "";

    if (!testId || !orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: "Invalid payment verification payload" },
        { status: 400 },
      );
    }

    const adminSupabase = createAdminClient();
    const [{ data: test, error: testError }, priceResult] = await Promise.all([
      adminSupabase
        .from("tests")
        .select("id, title")
        .eq("id", testId)
        .maybeSingle(),
      getSingleMockPricePaise(adminSupabase),
    ]);

    if (testError) {
      console.error("Failed to load mock test during verification", testError);
      return NextResponse.json(
        { error: "Unable to verify payment right now" },
        { status: 500 },
      );
    }

    if (!test) {
      return NextResponse.json(
        { error: "Mock test not found" },
        { status: 404 },
      );
    }

    if (priceResult.error || !priceResult.data) {
      console.error("Failed to load single mock price", priceResult.error);
      return NextResponse.json(
        { error: "Unable to verify payment right now" },
        { status: 500 },
      );
    }

    const isValidSignature = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature,
    });

    if (!isValidSignature) {
      await markMockPurchaseFailed(adminSupabase, {
        userId: user.id,
        testId,
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
    const expectedAmount = getExpectedAmountPaiseFromOrderNotes(
      order.notes,
      priceResult.data,
    );

    if (
      payment.order_id !== orderId ||
      payment.amount !== expectedAmount ||
      payment.currency !== "INR" ||
      order.amount !== expectedAmount ||
      order.currency !== "INR" ||
      order.notes?.purchase_type !== "mock_test" ||
      order.notes?.user_id !== user.id ||
      order.notes?.test_id !== test.id ||
      order.notes?.test_title !== test.title
    ) {
      await markMockPurchaseFailed(adminSupabase, {
        userId: user.id,
        testId,
        orderId,
        paymentId,
        failureReason: "Payment details did not match the selected mock test",
      });

      return NextResponse.json(
        { error: "Payment details do not match the selected mock test" },
        { status: 400 },
      );
    }

    const { data: updatedPurchase, error: purchaseError } =
      await markMockPurchaseVerified(adminSupabase, {
        userId: user.id,
        testId: test.id,
        orderId,
        paymentId,
        signature,
      });

    if (purchaseError) {
      console.error("Failed to verify mock purchase", purchaseError);
      return NextResponse.json(
        { error: "Unable to verify payment right now" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      testId: test.id,
      paymentStatus: updatedPurchase.payment_status,
    });
  } catch (error) {
    console.error("Mock test verify failed", error);

    return NextResponse.json(
      { error: "Unable to verify payment right now" },
      { status: 500 },
    );
  }
}
