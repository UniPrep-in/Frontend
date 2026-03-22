import type { SupabaseClient } from "@supabase/supabase-js";

type UpsertProfilePlanStatusInput = {
  userId: string;
  planId: string;
  paymentStatus: string;
  purchasedAt: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
};

export async function upsertProfilePlanStatus(
  supabase: SupabaseClient,
  input: UpsertProfilePlanStatusInput,
) {
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, plan_id, payment_status, purchased_at, razorpay_payment_id")
    .eq("id", input.userId)
    .maybeSingle();

  if (existingProfile?.razorpay_payment_id === input.razorpayPaymentId) {
    return {
      data: {
        id: existingProfile.id,
        plan_id: existingProfile.plan_id,
        payment_status: existingProfile.payment_status,
      },
      error: null,
    };
  }

  if (
    existingProfile?.purchased_at &&
    new Date(existingProfile.purchased_at).getTime() >
      new Date(input.purchasedAt).getTime()
  ) {
    return {
      data: {
        id: existingProfile.id,
        plan_id: existingProfile.plan_id,
        payment_status: existingProfile.payment_status,
      },
      error: null,
    };
  }

  return supabase
    .from("profiles")
    .upsert({
      id: input.userId,
      plan_id: input.planId,
      payment_status: input.paymentStatus,
      purchased_at: input.purchasedAt,
      razorpay_order_id: input.razorpayOrderId,
      razorpay_payment_id: input.razorpayPaymentId,
      updated_at: input.purchasedAt,
    })
    .select("id, plan_id, payment_status")
    .single();
}
