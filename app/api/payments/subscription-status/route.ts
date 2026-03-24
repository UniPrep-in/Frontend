import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLAN_CATALOG } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createBrowseAccess,
  getLatestVerifiedSubscriptionAccess,
} from "@/lib/subscriptions";

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
    const { data: access, error } = await getLatestVerifiedSubscriptionAccess(
      adminSupabase,
      user.id,
    );

    if (error) {
      console.error("Failed to load subscription status", error);
      return NextResponse.json(
        { error: "Unable to load subscription status" },
        { status: 500 },
      );
    }

    const resolvedAccess = access ?? createBrowseAccess();
    const plan = PLAN_CATALOG.find(
      (item) => item.planType === resolvedAccess.planType,
    );

    return NextResponse.json({
      planId: plan?.id ?? null,
      paymentStatus: access?.paymentStatus ?? null,
      stream: resolvedAccess.baseStreamKey,
      streamLabel: resolvedAccess.baseStreamLabel,
      gat: resolvedAccess.hasGat,
      isSubscriber: resolvedAccess.isSubscriber,
      selectableStreams: resolvedAccess.selectableMainStreams,
      allowedStreams: resolvedAccess.allowedContentStreams,
      allowedCategories: resolvedAccess.allowedCategories,
    });
  } catch (error) {
    console.error("Subscription status route failed", error);

    return NextResponse.json(
      { error: "Unable to load subscription status" },
      { status: 500 },
    );
  }
}
