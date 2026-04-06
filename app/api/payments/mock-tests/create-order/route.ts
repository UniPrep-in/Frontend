import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createPendingMockPurchase,
  getMockAccessState,
  getSingleMockPricePaise,
} from "@/lib/mock-test-purchases";
import { createRazorpayOrder, getRazorpayKeyId } from "@/lib/razorpay";

export const runtime = "nodejs";

type CreateOrderBody = {
  testId?: string;
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

    const body = (await req.json().catch(() => null)) as CreateOrderBody;
    const testId = body?.testId?.trim() || "";

    if (!testId) {
      return NextResponse.json(
        { error: "Invalid mock test selected" },
        { status: 400 },
      );
    }

    const adminSupabase = createAdminClient();
    const [testResult, priceResult, accessResult] = await Promise.all([
      adminSupabase
        .from("tests")
        .select("id, title")
        .eq("id", testId)
        .maybeSingle(),
      getSingleMockPricePaise(adminSupabase),
      getMockAccessState(adminSupabase, user.id, testId),
    ]);

    if (testResult.error) {
      console.error("Failed to load mock test for checkout", testResult.error);
      return NextResponse.json(
        { error: "Unable to initialize checkout right now" },
        { status: 500 },
      );
    }

    if (!testResult.data) {
      return NextResponse.json(
        { error: "Mock test not found" },
        { status: 404 },
      );
    }

    if (priceResult.error || !priceResult.data) {
      console.error("Failed to load single mock price", priceResult.error);
      return NextResponse.json(
        { error: "Single mock pricing is unavailable right now" },
        { status: 500 },
      );
    }

    if (accessResult.error || !accessResult.data) {
      console.error("Failed to load mock access state", accessResult.error);
      return NextResponse.json(
        { error: "Unable to initialize checkout right now" },
        { status: 500 },
      );
    }

    if (accessResult.data.canAccess) {
      return NextResponse.json(
        { error: "This mock is already unlocked for your account" },
        { status: 400 },
      );
    }

    const order = await createRazorpayOrder({
      amountPaise: priceResult.data,
      currency: "INR",
      receipt: `m-${testResult.data.id.slice(0, 8)}-${Date.now()}`,
      notes: {
        purchase_type: "mock_test",
        user_id: user.id,
        test_id: testResult.data.id,
        test_title: testResult.data.title,
        final_amount_paise: String(priceResult.data),
      },
    });

    const { error: purchaseError } = await createPendingMockPurchase(
      adminSupabase,
      {
        userId: user.id,
        testId: testResult.data.id,
        orderId: order.id,
        amount: priceResult.data,
        currency: order.currency,
        gateway: "razorpay",
      },
    );

    if (purchaseError) {
      console.error("Failed to create pending mock purchase", purchaseError);
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
      testId: testResult.data.id,
      testTitle: testResult.data.title,
      singleMockPricePaise: priceResult.data,
      finalAmountPaise: priceResult.data,
    });
  } catch (error) {
    console.error("Mock test create-order failed", error);

    return NextResponse.json(
      { error: "Unable to initialize checkout right now" },
      { status: 500 },
    );
  }
}
