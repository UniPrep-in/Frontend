import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLAN_CATALOG } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
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

    const adminSupabase = createAdminClient();
    const { data: subscription, error } = await adminSupabase
      .from("subscriptions")
      .select("plan_type, payment_status")
      .eq("user_id", user.id)
      .eq("payment_status", "verified")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Failed to load subscription status", error);
      return NextResponse.json(
        { error: "Unable to load subscription status" },
        { status: 500 },
      );
    }

    const plan = PLAN_CATALOG.find((item) => item.planType === subscription?.plan_type);

    return NextResponse.json({
      planId: plan?.id ?? null,
      paymentStatus: subscription?.payment_status ?? null,
    });
  } catch (error) {
    console.error("Subscription status route failed", error);

    return NextResponse.json(
      { error: "Unable to load subscription status" },
      { status: 500 },
    );
  }
}
